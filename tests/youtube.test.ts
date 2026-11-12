import assert from 'node:assert/strict';
import test from 'node:test';
import { parseYouTubeStartTime, parseYouTubeUrl } from '../src/app/utils/youtube.ts';

test('parseYouTubeStartTime parses integer seconds and h/m/s timestamps', () => {
  assert.equal(parseYouTubeStartTime('90'), 90);
  assert.equal(parseYouTubeStartTime('1m30s'), 90);
  assert.equal(parseYouTubeStartTime('1h2m3s'), 3723);
  assert.equal(parseYouTubeStartTime('0'), undefined);
  assert.equal(parseYouTubeStartTime('invalid'), undefined);
});

test('parseYouTubeUrl handles watch, short, shorts, live, and non-youtube links', () => {
  assert.deepEqual(parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s'), {
    videoId: 'dQw4w9WgXcQ',
    startSeconds: 42,
    embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&start=42',
  });
  assert.deepEqual(parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ'), {
    videoId: 'dQw4w9WgXcQ',
    startSeconds: undefined,
    embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1',
  });
  assert.equal(parseYouTubeUrl('https://youtube.com/shorts/AbCdEf12345')?.videoId, 'AbCdEf12345');
  assert.equal(parseYouTubeUrl('https://vimeo.com/123456'), undefined);
  assert.equal(parseYouTubeUrl('https://www.youtube.com/channel/UC123'), undefined);
});

