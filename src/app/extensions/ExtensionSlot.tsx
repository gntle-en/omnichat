import React, { FormEvent, useCallback, useState } from 'react';
import { atom, useAtom, useSetAtom } from 'jotai';
import { MatrixEvent, Room } from 'matrix-js-sdk';
import FocusTrap from 'focus-trap-react';
import {
  Badge,
  Box,
  Button,
  Dialog,
  Header,
  Icon,
  IconButton,
  IconSrc,
  Icons,
  Input,
  MenuItem,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Spinner,
  Text,
  TextArea,
  Tooltip,
  TooltipProvider,
  color,
  config,
  toRem,
} from 'folds';

import {
  BackendExtensionAction,
  ExtensionSlotId,
  isActionAvailable,
} from '../../util/backendExtensions';
import { useBackendExtensions } from '../hooks/useBackendExtensions';
import { useMatrixClient } from '../hooks/useMatrixClient';
import { ActionExecutionContext, executeBackendAction } from './executeAction';

type PendingExtensionTask = {
  action: BackendExtensionAction;
  context: ActionExecutionContext;
  onInsertDraft?: (text: string) => void;
};

type ActiveWidgetModal = {
  title: string;
  url: string;
  heightPx: number;
};

type ExtensionToast = {
  ok: boolean;
  text: string;
};

const pendingTaskAtom = atom<PendingExtensionTask | null>(null);
const activeWidgetAtom = atom<ActiveWidgetModal | null>(null);
const extensionToastAtom = atom<ExtensionToast | null>(null);

const ICON_MAP: Record<string, IconSrc> = {
  Bulb: Icons.Bulb,
  Clock: Icons.Clock,
  RecentClock: Icons.RecentClock,
  Terminal: Icons.Terminal,
  Code: Icons.Code,
  Send: Icons.Send,
  Plus: Icons.Plus,
  Info: Icons.Info,
  Warning: Icons.Warning,
  Message: Icons.Message,
  Pencil: Icons.Pencil,
  Setting: Icons.Setting,
  Delete: Icons.Delete,
  Shield: Icons.Shield,
  Globe: Icons.Globe,
  External: Icons.External,
  Check: Icons.Check,
};

function resolveIcon(name?: string): IconSrc {
  if (name && Object.prototype.hasOwnProperty.call(ICON_MAP, name)) {
    return ICON_MAP[name];
  }
  return Icons.Bulb;
}

function getButtonVariant(
  variant: BackendExtensionAction['variant']
): 'Primary' | 'Critical' | 'SurfaceVariant' {
  if (variant === 'primary') return 'Primary';
  if (variant === 'danger') return 'Critical';
  return 'SurfaceVariant';
}

function getMenuItemVariant(
  variant: BackendExtensionAction['variant']
): 'Critical' | 'Primary' | 'Surface' {
  if (variant === 'danger') return 'Critical';
  if (variant === 'primary') return 'Primary';
  return 'Surface';
}

function buildInitialFieldValues(action: BackendExtensionAction): Record<string, string> {
  const initial: Record<string, string> = {};
  action.fields?.forEach((field) => {
    initial[field.name] = field.defaultValue ?? '';
  });
  return initial;
}

/**
 * Global runtime overlay host mounted inside BackendExtensionsProvider so interactive
 * dialogs, sandboxed widgets, and status feedback persist even after menus close.
 */
export function ExtensionHost() {
  const mx = useMatrixClient();
  const [pendingTask, setPendingTask] = useAtom(pendingTaskAtom);
  const [activeWidget, setActiveWidget] = useAtom(activeWidgetAtom);
  const [toast, setToast] = useAtom(extensionToastAtom);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);

  // Synchronize initial defaults whenever a new task opens
  const taskId = pendingTask?.action.id;
  const [lastInitializedTaskKey, setLastInitializedTaskKey] = useState<string | null>(null);
  if (pendingTask && taskId) {
    const key = `${taskId}:${pendingTask.context.roomId}:${pendingTask.context.eventId ?? ''}`;
    if (key !== lastInitializedTaskKey) {
      setLastInitializedTaskKey(key);
      setFieldValues(buildInitialFieldValues(pendingTask.action));
    }
  } else if (lastInitializedTaskKey !== null) {
    setLastInitializedTaskKey(null);
  }

  const showToast = useCallback(
    (next: ExtensionToast) => {
      setToast(next);
      window.setTimeout(() => {
        setToast((current) => (current?.text === next.text ? null : current));
      }, 4500);
    },
    [setToast]
  );

  const runActionNow = useCallback(
    async (task: PendingExtensionTask, values: Record<string, string>) => {
      setRunning(true);
      const res = await executeBackendAction(mx, task.action, {
        ...task.context,
        fieldValues: values,
      });
      setRunning(false);
      setPendingTask(null);

      if (res.openWidgetUrl && task.action.transport.type === 'widget_modal') {
        setActiveWidget({
          title: task.action.transport.title ?? task.action.label,
          url: res.openWidgetUrl,
          heightPx: task.action.transport.heightPx ?? 480,
        });
        return;
      }

      if (res.ok && res.draftText && task.onInsertDraft) {
        task.onInsertDraft(res.draftText);
      }

      showToast({
        ok: res.ok,
        text: res.message,
      });
    },
    [mx, setPendingTask, setActiveWidget, showToast]
  );

  const handleFormSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    if (!pendingTask || running) return;
    runActionNow(pendingTask, fieldValues);
  };

  return (
    <>
      <Overlay open={!!pendingTask} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          {pendingTask && (
            <FocusTrap
              focusTrapOptions={{
                initialFocus: false,
                onDeactivate: () => {
                  if (!running) setPendingTask(null);
                },
                clickOutsideDeactivates: !running,
              }}
            >
              <Dialog variant="Surface" style={{ width: 'min(92vw, 460px)' }}>
                <Header
                  style={{ padding: `${config.space.S300} ${config.space.S400}` }}
                  variant="Surface"
                  size="400"
                >
                  <Box grow="Yes" alignItems="Center" gap="200">
                    <Icon src={resolveIcon(pendingTask.action.icon)} size="300" />
                    <Text size="H4" truncate>
                      {pendingTask.action.label}
                    </Text>
                  </Box>
                  <IconButton
                    size="300"
                    variant="Surface"
                    onClick={() => !running && setPendingTask(null)}
                  >
                    <Icon src={Icons.Cross} />
                  </IconButton>
                </Header>
                <Box
                  as="form"
                  onSubmit={handleFormSubmit}
                  direction="Column"
                  gap="300"
                  style={{ padding: config.space.S400 }}
                >
                  {pendingTask.action.description && (
                    <Text size="T300" priority="300">
                      {pendingTask.action.description}
                    </Text>
                  )}
                  {pendingTask.action.fields?.map((field) => {
                    const value = fieldValues[field.name] ?? '';
                    const setVal = (next: string) =>
                      setFieldValues((prev) => ({ ...prev, [field.name]: next }));

                    return (
                      <Box key={field.name} direction="Column" gap="100">
                        <Text as="label" size="L400">
                          {field.required ? `${field.label} *` : field.label}
                        </Text>
                        {field.type === 'textarea' && (
                          <TextArea
                            value={value}
                            onChange={(e) => setVal(e.currentTarget.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                            rows={4}
                            resize="Vertical"
                            variant="Secondary"
                            radii="300"
                            outlined
                          />
                        )}
                        {field.type === 'select' && (
                          <select
                            value={value}
                            onChange={(e) => setVal(e.currentTarget.value)}
                            required={field.required}
                            style={{
                              padding: `${config.space.S200} ${config.space.S300}`,
                              borderRadius: config.radii.R300,
                              backgroundColor: color.Secondary.Container,
                              color: color.Secondary.OnContainer,
                              border: `${toRem(1)} solid ${color.Secondary.ContainerLine}`,
                              fontSize: toRem(14),
                            }}
                          >
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {(field.type === 'text' || field.type === 'datetime') && (
                          <Input
                            type={field.type === 'datetime' ? 'datetime-local' : 'text'}
                            value={value}
                            onChange={(e) => setVal(e.currentTarget.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                            variant="Secondary"
                            size="300"
                            radii="300"
                            outlined
                          />
                        )}
                      </Box>
                    );
                  })}
                  <Box justifyContent="End" gap="200" style={{ paddingTop: config.space.S200 }}>
                    <Button
                      type="button"
                      size="300"
                      variant="Secondary"
                      fill="Soft"
                      radii="300"
                      disabled={running}
                      onClick={() => setPendingTask(null)}
                    >
                      <Text size="B300">Cancel</Text>
                    </Button>
                    <Button
                      type="submit"
                      size="300"
                      variant="Primary"
                      fill="Solid"
                      radii="300"
                      disabled={running}
                      before={running ? <Spinner size="100" /> : undefined}
                    >
                      <Text size="B300">{running ? 'Running...' : 'Run'}</Text>
                    </Button>
                  </Box>
                </Box>
              </Dialog>
            </FocusTrap>
          )}
        </OverlayCenter>
      </Overlay>

      <Overlay open={!!activeWidget} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          {activeWidget && (
            <Dialog variant="Surface" style={{ width: 'min(94vw, 760px)' }}>
              <Header
                style={{ padding: `${config.space.S300} ${config.space.S400}` }}
                variant="Surface"
                size="400"
              >
                <Box grow="Yes" alignItems="Center" gap="200">
                  <Icon src={Icons.Globe} size="300" />
                  <Text size="H4" truncate>
                    {activeWidget.title}
                  </Text>
                </Box>
                <IconButton size="300" variant="Surface" onClick={() => setActiveWidget(null)}>
                  <Icon src={Icons.Cross} />
                </IconButton>
              </Header>
              <Box style={{ padding: config.space.S200 }}>
                <iframe
                  title={activeWidget.title}
                  src={activeWidget.url}
                  sandbox="allow-scripts allow-forms allow-popups"
                  style={{
                    width: '100%',
                    height: toRem(activeWidget.heightPx),
                    border: 'none',
                    borderRadius: config.radii.R300,
                    backgroundColor: color.SurfaceVariant.Container,
                  }}
                />
              </Box>
            </Dialog>
          )}
        </OverlayCenter>
      </Overlay>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: toRem(24),
            right: toRem(24),
            zIndex: 9999,
            maxWidth: toRem(380),
          }}
        >
          <Badge variant={toast.ok ? 'Success' : 'Critical'} fill="Solid" radii="400">
            <Box
              alignItems="Center"
              gap="200"
              style={{ padding: `${config.space.S100} ${config.space.S200}` }}
            >
              <Icon size="100" src={toast.ok ? Icons.Check : Icons.Warning} />
              <Text size="T300" style={{ whiteSpace: 'normal' }}>
                {toast.text}
              </Text>
              <IconButton size="300" variant="Secondary" onClick={() => setToast(null)}>
                <Icon size="50" src={Icons.Cross} />
              </IconButton>
            </Box>
          </Badge>
        </div>
      )}
    </>
  );
}

type ExtensionSlotProps = {
  slot: ExtensionSlotId;
  room: Room;
  mEvent?: MatrixEvent;
  threadRootId?: string;
  getDraftText?: () => string;
  onInsertDraft?: (text: string) => void;
  onActionTriggered?: () => void;
};

/**
 * Renders declarative backend extension triggers for a given UI slot using native Folds primitives.
 */
export function ExtensionSlot({
  slot,
  room,
  mEvent,
  threadRootId,
  getDraftText,
  onInsertDraft,
  onActionTriggered,
}: ExtensionSlotProps) {
  const mx = useMatrixClient();
  const manifest = useBackendExtensions();
  const setPendingTask = useSetAtom(pendingTaskAtom);
  const setActiveWidget = useSetAtom(activeWidgetAtom);
  const setToast = useSetAtom(extensionToastAtom);

  const userId = mx.getUserId() ?? '';
  const userPowerLevel = room.getMember(userId)?.powerLevel ?? 0;
  let roomType: 'dm' | 'group' | 'space' = 'group';
  if (room.isSpaceRoom()) {
    roomType = 'space';
  } else if (room.getJoinedMemberCount() <= 2) {
    roomType = 'dm';
  }
  const isEncrypted = mx.isRoomEncrypted(room.roomId);
  const isOwnMessage = mEvent ? mEvent.getSender() === userId : undefined;

  const actions = manifest.actions.filter(
    (action) =>
      action.slot === slot &&
      isActionAvailable(action, {
        roomType,
        isEncrypted,
        userPowerLevel,
        isOwnMessage,
      })
  );

  if (actions.length === 0) return null;

  const triggerAction = async (action: BackendExtensionAction) => {
    onActionTriggered?.();
    const context: ActionExecutionContext = {
      roomId: room.roomId,
      eventId: mEvent?.getId(),
      messageBody:
        typeof mEvent?.getContent().body === 'string'
          ? (mEvent.getContent().body as string)
          : undefined,
      draftText: getDraftText ? getDraftText() : undefined,
      threadRootId,
    };

    if (action.fields && action.fields.length > 0) {
      setPendingTask({
        action,
        context,
        onInsertDraft,
      });
      return;
    }

    const res = await executeBackendAction(mx, action, context);
    if (res.openWidgetUrl && action.transport.type === 'widget_modal') {
      setActiveWidget({
        title: action.transport.title ?? action.label,
        url: res.openWidgetUrl,
        heightPx: action.transport.heightPx ?? 480,
      });
      return;
    }
    if (res.ok && res.draftText && onInsertDraft) {
      onInsertDraft(res.draftText);
    }
    setToast({
      ok: res.ok,
      text: res.message,
    });
    window.setTimeout(() => {
      setToast((current) => (current?.text === res.message ? null : current));
    }, 4500);
  };

  if (slot === 'message.contextMenu') {
    return (
      <>
        {actions.map((action) => (
          <MenuItem
            key={action.id}
            size="300"
            variant={getMenuItemVariant(action.variant)}
            after={<Icon size="100" src={resolveIcon(action.icon)} />}
            radii="300"
            onClick={() => triggerAction(action)}
          >
            <Text as="span" size="T300" truncate>
              {action.label}
            </Text>
          </MenuItem>
        ))}
      </>
    );
  }

  return (
    <>
      {actions.map((action) => (
        <TooltipProvider
          key={action.id}
          tooltip={
            <Tooltip>
              <Text>{action.description || action.label}</Text>
            </Tooltip>
          }
        >
          {(triggerRef) => (
            <IconButton
              ref={triggerRef}
              variant={getButtonVariant(action.variant)}
              size="300"
              radii="300"
              aria-label={action.label}
              onClick={() => triggerAction(action)}
            >
              <Icon src={resolveIcon(action.icon)} />
            </IconButton>
          )}
        </TooltipProvider>
      ))}
    </>
  );
}
