export interface ParsedYouTubeVideo {
  videoId: string;
  startSeconds?: number;
  embedUrl: string;
}

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{6,32}$/;

/** Parse YouTube `t` or `start` timestamps (e.g. "90", "90s", "1m30s", "1h2m3s") into whole seconds. */
export function parseYouTubeStartTime(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) {
    const secs = parseInt(trimmed, 10);
    return secs > 0 ? secs : undefined;
  }
  const match = trimmed.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match) return undefined;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  const secs = match[3] ? parseInt(match[3], 10) : 0;
  const total = hours * 3600 + mins * 60 + secs;
  return total > 0 ? total : undefined;
}

/** Extract a YouTube video ID and privacy-enhanced embed URL if the link points to a playable video. */
export function parseYouTubeUrl(rawUrl: string): ParsedYouTubeVideo | undefined {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return undefined;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return undefined;

  let videoId: string | undefined;
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const segment = url.pathname.split('/').filter(Boolean)[0];
    videoId = segment;
  } else if (url.pathname === '/watch') {
    videoId = url.searchParams.get('v') ?? undefined;
  } else if (
    url.pathname.startsWith('/shorts/') ||
    url.pathname.startsWith('/live/') ||
    url.pathname.startsWith('/embed/')
  ) {
    [, , videoId] = url.pathname.split('/');
  }

  if (!videoId || !VIDEO_ID_REGEX.test(videoId)) return undefined;

  const startSeconds = parseYouTubeStartTime(
    url.searchParams.get('t') ?? url.searchParams.get('start')
  );
  const embedParams = new URLSearchParams({ autoplay: '1' });
  if (startSeconds !== undefined) {
    embedParams.set('start', String(startSeconds));
  }

  return {
    videoId,
    startSeconds,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?${embedParams.toString()}`,
  };
}
