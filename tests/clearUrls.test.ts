import assert from 'node:assert/strict';
import test from 'node:test';
import { clearUrl, clearUrlsFromText } from '../src/app/utils/clearUrls.ts';

test('clearUrl strips universal and host-specific tracking parameters', () => {
  assert.equal(
    clearUrl('https://example.com/post?id=42&utm_source=newsletter&fbclid=abc123'),
    'https://example.com/post?id=42'
  );
  assert.equal(
    clearUrl('https://youtu.be/dQw4w9WgXcQ?si=sharetoken&t=30'),
    'https://youtu.be/dQw4w9WgXcQ?t=30'
  );
  assert.equal(
    clearUrl('https://www.amazon.com/dp/B000123?ref_=sr_1_1&qid=12345'),
    'https://www.amazon.com/dp/B000123'
  );
});

test('clearUrl leaves non-http URLs and clean URLs unchanged', () => {
  assert.equal(clearUrl('https://matrix.org/docs/'), 'https://matrix.org/docs/');
  assert.equal(
    clearUrl('mxc://matrix.org/abc123?utm_source=x'),
    'mxc://matrix.org/abc123?utm_source=x'
  );
  assert.equal(clearUrl('not-a-url'), 'not-a-url');
});

test('clearUrlsFromText sanitizes HTTP links inside prose', () => {
  assert.equal(
    clearUrlsFromText(
      'Check https://twitter.com/user/status/123?s=20&t=xyz and https://example.com/?utm_medium=chat!'
    ),
    'Check https://twitter.com/user/status/123 and https://example.com/!'
  );
});
