import { IContent, MatrixEvent } from 'matrix-js-sdk';

const MAX_CACHED_EVENTS = 2500;
const contentCache = new Map<string, IContent>();

function cacheKey(roomId: string, eventId: string): string {
  return `${roomId}\u0000${eventId}`;
}

/**
 * Caches pre-redaction message content so inline-red deleted-message rendering
 * can still display what was deleted during this client session.
 */
export function rememberEventContentForRedaction(mEvent: MatrixEvent): void {
  const roomId = mEvent.getRoomId();
  const eventId = mEvent.getId();
  if (!roomId || !eventId || mEvent.isRedacted()) return;

  const content = mEvent.getContent();
  if (!content || typeof content.body !== 'string' || content.body.length === 0) return;

  const key = cacheKey(roomId, eventId);
  if (contentCache.has(key)) {
    contentCache.delete(key);
  }
  contentCache.set(key, { ...content });

  if (contentCache.size > MAX_CACHED_EVENTS) {
    const oldestKey = contentCache.keys().next().value;
    if (oldestKey) contentCache.delete(oldestKey);
  }
}

export type RetainedDeletedContent = {
  body: string;
  formattedBody?: string;
  format?: string;
  msgtype?: string;
  source: 'server_retained' | 'local_cache' | 'none';
};

/**
 * Extracts original content for a redacted event from either:
 * 1) backend-provided `unsigned['dev.omnichat.original_content']` / `unsigned.original_content`
 * 2) pre-redaction session cache
 */
export function getRetainedDeletedContent(mEvent: MatrixEvent): RetainedDeletedContent {
  const unsigned = mEvent.getUnsigned() as Record<string, unknown> | undefined;
  const serverRetained =
    (unsigned?.['dev.omnichat.original_content'] as Record<string, unknown> | undefined) ??
    (unsigned?.original_content as Record<string, unknown> | undefined);

  if (serverRetained && typeof serverRetained.body === 'string' && serverRetained.body.length > 0) {
    return {
      body: serverRetained.body,
      formattedBody:
        typeof serverRetained.formatted_body === 'string'
          ? serverRetained.formatted_body
          : undefined,
      format: typeof serverRetained.format === 'string' ? serverRetained.format : undefined,
      msgtype: typeof serverRetained.msgtype === 'string' ? serverRetained.msgtype : undefined,
      source: 'server_retained',
    };
  }

  const roomId = mEvent.getRoomId();
  const eventId = mEvent.getId();
  if (roomId && eventId) {
    const cached = contentCache.get(cacheKey(roomId, eventId));
    if (cached && typeof cached.body === 'string' && cached.body.length > 0) {
      return {
        body: cached.body,
        formattedBody:
          typeof cached.formatted_body === 'string' ? cached.formatted_body : undefined,
        format: typeof cached.format === 'string' ? cached.format : undefined,
        msgtype: typeof cached.msgtype === 'string' ? cached.msgtype : undefined,
        source: 'local_cache',
      };
    }
  }

  return {
    body: '',
    source: 'none',
  };
}
