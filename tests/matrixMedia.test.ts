import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMediaUrlResolver,
  getMediaCacheKey,
  isHomeserverMediaUrl,
  rewriteMediaEndpoint,
} from '../src/util/matrixMedia.ts';

test('isHomeserverMediaUrl only allows same-origin Matrix media download/thumbnail URLs', () => {
  const hs = 'https://matrix.example.org';
  assert.equal(
    isHomeserverMediaUrl('https://matrix.example.org/_matrix/media/v3/thumbnail/hs/abc', hs),
    true,
  );
  assert.equal(
    isHomeserverMediaUrl('https://matrix.example.org/_matrix/client/v1/media/download/hs/abc', hs),
    true,
  );
  assert.equal(
    isHomeserverMediaUrl('https://evil.example.org/_matrix/media/v3/download/hs/abc', hs),
    false,
  );
  assert.equal(isHomeserverMediaUrl('https://matrix.example.org/assets/avatar.svg', hs), false);
  assert.equal(isHomeserverMediaUrl('blob:https://app.example/123', hs), false);
});

test('rewriteMediaEndpoint and getMediaCacheKey preserve query params and unify keys', () => {
  const legacyUrl =
    'https://matrix.example.org/_matrix/media/v3/thumbnail/other.org/id1?width=80&height=80&method=crop';
  const authUrl = rewriteMediaEndpoint(legacyUrl, 'auth');
  assert.equal(
    authUrl,
    'https://matrix.example.org/_matrix/client/v1/media/thumbnail/other.org/id1?width=80&height=80&method=crop',
  );
  assert.equal(
    rewriteMediaEndpoint(authUrl, 'legacy'),
    'https://matrix.example.org/_matrix/media/v3/thumbnail/other.org/id1?width=80&height=80&method=crop',
  );
  assert.equal(
    getMediaCacheKey(legacyUrl, 'https://matrix.example.org'),
    getMediaCacheKey(authUrl, 'https://matrix.example.org'),
  );
});

test('resolver tries authenticated endpoint first and deduplicates cache entries', async () => {
  const resolver = createMediaUrlResolver();
  const requests: Array<{ url: string; auth?: string }> = [];

  const legacyUrl = 'https://hs.example/_matrix/media/v3/thumbnail/hs.example/avatar1';
  const blobUrl = await resolver.resolveUrl(legacyUrl, {
    homeserverUrl: 'https://hs.example',
    accessToken: 'secret-token',
    createObjectUrl: () => 'blob:mock-1',
    fetchImpl: async (url, init) => {
      requests.push({ url, auth: init?.headers?.Authorization });
      return new Response('ok', { status: 200 });
    },
  });

  assert.equal(blobUrl, 'blob:mock-1');
  assert.deepEqual(requests, [
    {
      url: 'https://hs.example/_matrix/client/v1/media/thumbnail/hs.example/avatar1',
      auth: 'Bearer secret-token',
    },
  ]);

  assert.equal(resolver.getCachedUrl(legacyUrl, 'https://hs.example'), 'blob:mock-1');
  assert.equal(
    resolver.getCachedUrl(
      'https://hs.example/_matrix/client/v1/media/thumbnail/hs.example/avatar1',
      'https://hs.example',
    ),
    'blob:mock-1',
  );
});

test('resolver falls back to legacy endpoint on 404 and remembers legacy mode without caching failures', async () => {
  const resolver = createMediaUrlResolver();
  const requestedUrls: string[] = [];

  const first = await resolver.resolveUrl('https://old.example/_matrix/media/v3/download/old/m1', {
    homeserverUrl: 'https://old.example',
    accessToken: 'tok',
    createObjectUrl: () => 'blob:legacy-1',
    fetchImpl: async (url) => {
      requestedUrls.push(url);
      if (url.includes('/_matrix/client/v1/media/')) {
        return new Response('{"errcode":"M_UNRECOGNIZED"}', { status: 404 });
      }
      return new Response('img-bytes', { status: 200 });
    },
  });

  assert.equal(first, 'blob:legacy-1');
  assert.deepEqual(requestedUrls, [
    'https://old.example/_matrix/client/v1/media/download/old/m1',
    'https://old.example/_matrix/media/v3/download/old/m1',
  ]);

  requestedUrls.length = 0;
  const second = await resolver.resolveUrl(
    'https://old.example/_matrix/client/v1/media/download/old/m2',
    {
      homeserverUrl: 'https://old.example',
      accessToken: 'tok',
      createObjectUrl: () => 'blob:legacy-2',
      fetchImpl: async (url) => {
        requestedUrls.push(url);
        return new Response('img-bytes', { status: 200 });
      },
    },
  );
  assert.equal(second, 'blob:legacy-2');
  assert.deepEqual(requestedUrls, ['https://old.example/_matrix/media/v3/download/old/m2']);

  const missingUrl = 'https://old.example/_matrix/media/v3/download/old/missing';
  const failed = await resolver.resolveUrl(missingUrl, {
    homeserverUrl: 'https://old.example',
    accessToken: 'tok',
    createObjectUrl: () => 'blob:should-not-create',
    fetchImpl: async () => new Response('not found', { status: 404 }),
  });
  assert.equal(failed, missingUrl);
  assert.equal(resolver.getCachedUrl(missingUrl, 'https://old.example'), null);
});
