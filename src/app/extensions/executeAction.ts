import { EventType, IContent, MatrixClient, MsgType, RelationType } from 'matrix-js-sdk';

import {
  BackendExtensionAction,
  SendLaterConfig,
  interpolateTemplate,
} from '../../util/backendExtensions';

export type ActionExecutionContext = {
  roomId: string;
  eventId?: string;
  messageBody?: string;
  draftText?: string;
  threadRootId?: string;
  fieldValues?: Record<string, string>;
};

export type ActionExecutionResult = {
  ok: boolean;
  message: string;
  draftText?: string;
  replyBody?: string;
  openWidgetUrl?: string;
};

/**
 * Schedules a message using MSC4140 delayed events or a custom HTTP RPC scheduler endpoint.
 */
export async function sendDelayedMessage(
  mx: MatrixClient,
  config: SendLaterConfig,
  options: {
    roomId: string;
    content: IContent;
    delayMs: number;
    threadRootId?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  const { roomId, content, delayMs, threadRootId = null } = options;

  if (config.transport === 'http_rpc' && config.endpoint) {
    try {
      const openId = await mx.getOpenIdToken();
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          delayMs,
          sendAt: Date.now() + delayMs,
          threadRootId,
          eventType: EventType.RoomMessage,
          content,
          openIdToken: openId,
        }),
      });
      if (!response.ok) {
        return { ok: false, error: `Scheduler returned HTTP ${response.status}` };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to reach schedule endpoint.',
      };
    }
  }

  try {
    await mx._unstable_sendDelayedEvent(
      roomId,
      { delay: delayMs },
      threadRootId,
      EventType.RoomMessage,
      content as never
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Homeserver rejected delayed event (MSC4140 may be disabled).',
    };
  }
}

function buildTemplateVars(mx: MatrixClient, ctx: ActionExecutionContext): Record<string, string> {
  const vars: Record<string, string> = {
    roomId: ctx.roomId,
    userId: mx.getUserId() ?? '',
    eventId: ctx.eventId ?? '',
    messageBody: ctx.messageBody ?? '',
    draftText: ctx.draftText ?? '',
    threadRootId: ctx.threadRootId ?? '',
  };
  if (ctx.fieldValues) {
    Object.entries(ctx.fieldValues).forEach(([key, val]) => {
      vars[`field.${key}`] = val;
    });
  }
  return vars;
}

/**
 * Executes a declarative backend extension action over matrix_event, http_rpc, or widget_modal.
 */
export async function executeBackendAction(
  mx: MatrixClient,
  action: BackendExtensionAction,
  ctx: ActionExecutionContext
): Promise<ActionExecutionResult> {
  const vars = buildTemplateVars(mx, ctx);

  if (action.transport.type === 'widget_modal') {
    const url = new URL(action.transport.url);
    url.searchParams.set('roomId', ctx.roomId);
    if (ctx.eventId) url.searchParams.set('eventId', ctx.eventId);
    return {
      ok: true,
      message: action.transport.title ?? action.label,
      openWidgetUrl: url.toString(),
    };
  }

  if (action.transport.type === 'matrix_event') {
    try {
      const renderedContent = action.transport.contentTemplate
        ? (interpolateTemplate(action.transport.contentTemplate, vars) as Record<string, unknown>)
        : {
            actionId: action.id,
            roomId: ctx.roomId,
            eventId: ctx.eventId,
            fields: ctx.fieldValues ?? {},
          };

      if (typeof action.transport.stateKey === 'string') {
        await mx.sendStateEvent(
          ctx.roomId,
          action.transport.eventType as never,
          renderedContent as never,
          action.transport.stateKey
        );
      } else {
        await mx.sendEvent(
          ctx.roomId,
          action.transport.eventType as never,
          renderedContent as never
        );
      }

      return {
        ok: true,
        message: `${action.label} sent`,
      };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Failed to send Matrix event',
      };
    }
  }

  // http_rpc transport
  try {
    const openIdToken =
      action.transport.auth === 'matrix_openid' ? await mx.getOpenIdToken() : null;
    const response = await fetch(action.transport.endpoint, {
      method: action.transport.method ?? 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actionId: action.id,
        roomId: ctx.roomId,
        eventId: ctx.eventId,
        messageBody: ctx.messageBody,
        draftText: ctx.draftText,
        threadRootId: ctx.threadRootId,
        fields: ctx.fieldValues ?? {},
        userId: mx.getUserId(),
        openIdToken,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Backend returned HTTP ${response.status}`,
      };
    }

    const contentType = response.headers.get('content-type') ?? '';
    let payload: Record<string, unknown> = {};
    if (contentType.includes('application/json')) {
      const parsed: unknown = await response.json();
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        payload = parsed as Record<string, unknown>;
      }
    }

    const textResult =
      (typeof payload.draftText === 'string' && payload.draftText) ||
      (typeof payload.replyText === 'string' && payload.replyText) ||
      (typeof payload.text === 'string' && payload.text) ||
      (typeof payload.message === 'string' && payload.message) ||
      '';

    if (action.transport.resultHandling === 'insert_draft' && textResult) {
      return {
        ok: true,
        message: 'Draft inserted into composer',
        draftText: textResult,
      };
    }

    if (action.transport.resultHandling === 'send_reply' && textResult) {
      const msgContent: IContent = {
        msgtype: MsgType.Text,
        body: textResult,
      };
      if (ctx.eventId) {
        msgContent['m.relates_to'] = {
          'm.in_reply_to': { event_id: ctx.eventId },
          ...(ctx.threadRootId
            ? {
                rel_type: RelationType.Thread,
                event_id: ctx.threadRootId,
                is_falling_back: false,
              }
            : {}),
        };
      }
      await mx.sendMessage(ctx.roomId, msgContent as never);
      return {
        ok: true,
        message: 'Reply sent',
        replyBody: textResult,
      };
    }

    return {
      ok: true,
      message: textResult || `${action.label} completed`,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Request to backend action failed',
    };
  }
}
