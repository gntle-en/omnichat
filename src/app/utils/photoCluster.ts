import type { MatrixEvent } from 'matrix-js-sdk';

export type PhotoStackItem = {
  eventId: string;
  url: string;
  body: string;
  filename?: string;
  mimeType?: string;
  info?: Record<string, unknown>;
  encInfo?: Record<string, unknown>;
  markedAsSpoiler?: boolean;
  spoilerReason?: string;
  ts?: number;
};

/**
 * Extract photo metadata from a MatrixEvent if it represents an image attachment.
 */
export function matrixEventToPhotoStackItem(mEvent: MatrixEvent): PhotoStackItem | null {
  if (mEvent.isRedacted()) return null;
  const content = mEvent.getContent();
  if (!content) return null;

  const { msgtype } = content;
  if (msgtype !== 'm.image') return null;

  const mxcUrl = content.file?.url ?? content.url;
  if (typeof mxcUrl !== 'string' || !mxcUrl.trim()) return null;

  return {
    eventId: mEvent.getId() ?? '',
    url: mxcUrl,
    body: content.body || 'Photo',
    filename: content.filename,
    mimeType: content.info?.mimetype,
    info: content.info,
    encInfo: content.file,
    markedAsSpoiler: content['org.matrix.msc3720.spoiler'] || content.spoiler,
    spoilerReason: content['org.matrix.msc3720.spoiler_reason'],
    ts: mEvent.getTs(),
  };
}

export type PhotoClusterResult = {
  isHead: boolean;
  cluster: PhotoStackItem[] | null;
};

/**
 * Inspect consecutive timeline events around `item` index to detect multi-photo clusters.
 * Groups 2 or more consecutive photos from the same sender within 2 minutes into a stack.
 */
export function findPhotoCluster(
  item: number,
  getItemsCount: () => number,
  getEventAt: (index: number) => MatrixEvent | undefined
): PhotoClusterResult {
  const currentEvent = getEventAt(item);
  if (!currentEvent || currentEvent.isRedacted()) {
    return { isHead: false, cluster: null };
  }

  // Check if currentEvent has internal multiple images array (e.g. MSC3801 / custom gallery)
  const content = currentEvent.getContent();
  if (content && Array.isArray(content.images) && content.images.length >= 2) {
    const internalCluster: PhotoStackItem[] = (content.images as any[])
      .map((img: any, idx: number): PhotoStackItem | null => {
        const url = img?.file?.url ?? img?.url;
        if (typeof url !== 'string' || !url.trim()) return null;
        return {
          eventId: `${currentEvent.getId() ?? 'img'}_${idx}`,
          url,
          body: img.body || `Photo ${idx + 1}`,
          mimeType: img.info?.mimetype,
          info: img.info,
          encInfo: img.file,
          ts: currentEvent.getTs(),
        };
      })
      .filter((x): x is PhotoStackItem => x !== null);

    if (internalCluster.length >= 2) {
      return { isHead: true, cluster: internalCluster };
    }
  }

  const currentItem = matrixEventToPhotoStackItem(currentEvent);
  if (!currentItem) {
    return { isHead: false, cluster: null };
  }

  // Check if preceded by an image from the same sender within 2 minutes
  if (item > 0) {
    const prevEvent = getEventAt(item - 1);
    if (
      prevEvent &&
      !prevEvent.isRedacted() &&
      matrixEventToPhotoStackItem(prevEvent) &&
      prevEvent.getSender() === currentEvent.getSender() &&
      Math.abs(currentEvent.getTs() - prevEvent.getTs()) < 120_000
    ) {
      // Already absorbed by the head photo event
      return { isHead: false, cluster: null };
    }
  }

  // Current item is the head. Look forward for consecutive image messages:
  const cluster: PhotoStackItem[] = [currentItem];
  let forwardIndex = item + 1;
  const total = getItemsCount();

  while (forwardIndex < total) {
    const nextEvent = getEventAt(forwardIndex);
    if (
      nextEvent &&
      !nextEvent.isRedacted() &&
      nextEvent.getSender() === currentEvent.getSender() &&
      Math.abs(nextEvent.getTs() - currentEvent.getTs()) < 120_000
    ) {
      const nextItem = matrixEventToPhotoStackItem(nextEvent);
      if (nextItem) {
        cluster.push(nextItem);
        forwardIndex += 1;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  if (cluster.length >= 2) {
    return { isHead: true, cluster };
  }

  return { isHead: true, cluster: null };
}
