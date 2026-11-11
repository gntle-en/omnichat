const LEGACY_MEDIA_PREFIXES = ['/_matrix/media/v3/', '/_matrix/media/r0/'] as const;
const AUTH_MEDIA_PREFIX = '/_matrix/client/v1/media/';
const RETRYABLE_MEDIA_STATUSES = new Set([401, 403, 404]);
const MAX_MEDIA_CACHE_SIZE = 10000;

export type MediaEndpointMode = 'auth' | 'legacy';

export type MediaFetchLike = (
  _input: string,
  _init?: { method?: string; headers?: Record<string, string> },
) => Promise<Response>;

export type MediaResolveOptions = {
  homeserverUrl?: string | null;
  accessToken?: string | null;
  transformResponse?: (_response: Response) => Promise<Blob>;
  fetchImpl?: MediaFetchLike;
  createObjectUrl?: (_blob: Blob) => string;
};

function parseUrl(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

function getMediaPathSuffix(pathname: string): { mode: MediaEndpointMode; suffix: string } | null {
  if (pathname.startsWith(AUTH_MEDIA_PREFIX)) {
    const suffix = pathname.slice(AUTH_MEDIA_PREFIX.length);
    if (suffix.startsWith('download/') || suffix.startsWith('thumbnail/')) {
      return { mode: 'auth', suffix };
    }
    return null;
  }

  const legacyPrefix = LEGACY_MEDIA_PREFIXES.find((prefix) => pathname.startsWith(prefix));
  if (!legacyPrefix) return null;

  const suffix = pathname.slice(legacyPrefix.length);
  if (suffix.startsWith('download/') || suffix.startsWith('thumbnail/')) {
    return { mode: 'legacy', suffix };
  }
  return null;
}

/** Checks whether `link` targets a Matrix media download or thumbnail endpoint on `homeserverUrl`. */
export function isHomeserverMediaUrl(link?: string | null, homeserverUrl?: string | null): boolean {
  if (!link || !homeserverUrl) return false;
  const linkUrl = parseUrl(link);
  const hsUrl = parseUrl(homeserverUrl);
  if (!linkUrl || !hsUrl || linkUrl.origin !== hsUrl.origin) return false;
  return getMediaPathSuffix(linkUrl.pathname) !== null;
}

/** Rewrites a Matrix media URL between `/_matrix/client/v1/media/` and `/_matrix/media/v3/`. */
export function rewriteMediaEndpoint(link: string, mode: MediaEndpointMode): string {
  const url = parseUrl(link);
  if (!url) return link;
  const match = getMediaPathSuffix(url.pathname);
  if (!match) return link;
  const targetPrefix = mode === 'auth' ? AUTH_MEDIA_PREFIX : '/_matrix/media/v3/';
  url.pathname = `${targetPrefix}${match.suffix}`;
  return url.href;
}

/** Normalizes homeserver media URLs so legacy and authenticated paths share one cache entry. */
export function getMediaCacheKey(link: string, homeserverUrl?: string | null): string {
  if (isHomeserverMediaUrl(link, homeserverUrl)) {
    return rewriteMediaEndpoint(link, 'auth');
  }
  return link;
}

/** Creates an isolated media URL cache and endpoint-negotiating fetcher. */
export function createMediaUrlResolver() {
  const cachedMedia = new Map<string, string | Promise<string>>();
  const serverModeByOrigin = new Map<string, MediaEndpointMode>();

  const getCachedUrl = (link?: string | null, homeserverUrl?: string | null): string | null => {
    if (!link) return null;
    const cacheKey = getMediaCacheKey(link, homeserverUrl);
    const cached = cachedMedia.get(cacheKey);
    return typeof cached === 'string' ? cached : null;
  };

  const fetchMediaResponse = async (
    link: string,
    homeserverUrl: string,
    accessToken: string | null | undefined,
    fetchImpl: MediaFetchLike,
  ): Promise<Response> => {
    const hsOrigin = new URL(homeserverUrl).origin;
    const preferredMode = serverModeByOrigin.get(hsOrigin) ?? 'auth';
    const primaryUrl = rewriteMediaEndpoint(link, preferredMode);
    const headers: Record<string, string> = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const response = await fetchImpl(primaryUrl, { method: 'GET', headers });
    if (response.ok || !RETRYABLE_MEDIA_STATUSES.has(response.status)) {
      return response;
    }

    const fallbackMode: MediaEndpointMode = preferredMode === 'auth' ? 'legacy' : 'auth';
    const fallbackUrl = rewriteMediaEndpoint(link, fallbackMode);
    if (fallbackUrl === primaryUrl) {
      return response;
    }

    const fallbackResponse = await fetchImpl(fallbackUrl, { method: 'GET', headers });
    if (fallbackResponse.ok) {
      serverModeByOrigin.set(hsOrigin, fallbackMode);
    }
    return fallbackResponse;
  };

  const resolveUrl = async (link: string, options: MediaResolveOptions = {}): Promise<string> => {
    const { homeserverUrl, accessToken, transformResponse } = options;
    if (!isHomeserverMediaUrl(link, homeserverUrl)) {
      console.error(
        "got media link to unexpected homeserver, aborting so we don't send them our token",
        link,
      );
      return link;
    }

    const cacheKey = getMediaCacheKey(link, homeserverUrl);
    if (cachedMedia.has(cacheKey)) {
      const cachedValue = cachedMedia.get(cacheKey);
      if (typeof cachedValue === 'string') return cachedValue;
      const res = (await cachedValue)!;
      return res;
    }

    let resolvePromise: undefined | ((_value: string) => void);
    const promise = new Promise<string>((resolve: (_value: string) => void) => {
      resolvePromise = resolve;
    });
    cachedMedia.set(cacheKey, promise);

    if (cachedMedia.size > MAX_MEDIA_CACHE_SIZE) {
      console.info('cachedUnencryptedMedia is too large, clearing');
      cachedMedia.forEach((value, key) => {
        if (typeof value === 'string') {
          cachedMedia.delete(key);
        }
      });
    }

    try {
      const fetchImpl: MediaFetchLike = options.fetchImpl ?? ((input, init) => fetch(input, init));
      const createObjectUrl =
        options.createObjectUrl ?? ((blob: Blob) => URL.createObjectURL(blob));
      const response = await fetchMediaResponse(link, homeserverUrl!, accessToken, fetchImpl);
      if (!response.ok) {
        throw new Error(`Media request failed with status ${response.status}`);
      }

      const blob = transformResponse ? await transformResponse(response) : await response.blob();
      const objectUrl = createObjectUrl(blob);
      cachedMedia.set(cacheKey, objectUrl);
      resolvePromise?.(objectUrl);
      return objectUrl;
    } catch (e) {
      console.error(e);
      if (cachedMedia.get(cacheKey) === promise) {
        cachedMedia.delete(cacheKey);
      }
      resolvePromise?.(link);
      return link;
    }
  };

  return {
    getCachedUrl,
    resolveUrl,
  };
}

const defaultResolver = createMediaUrlResolver();

export const getCachedMediaUrl = defaultResolver.getCachedUrl;
export const resolveMediaUrl = defaultResolver.resolveUrl;
