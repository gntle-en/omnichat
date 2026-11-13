import assert from 'node:assert/strict';
import test from 'node:test';
import { findPhotoCluster, matrixEventToPhotoStackItem } from '../src/app/utils/photoCluster.ts';

function createMockEvent(opts: {
  id: string;
  sender: string;
  ts: number;
  msgtype?: string;
  url?: string;
  body?: string;
  redacted?: boolean;
  images?: any[];
}) {
  return {
    getId: () => opts.id,
    getSender: () => opts.sender,
    getTs: () => opts.ts,
    getType: () => 'm.room.message',
    isRedacted: () => opts.redacted ?? false,
    getContent: () => ({
      msgtype: opts.msgtype ?? 'm.image',
      url: opts.url ?? `mxc://example.org/${opts.id}`,
      body: opts.body ?? `Photo ${opts.id}`,
      images: opts.images,
    }),
  } as any;
}

test('matrixEventToPhotoStackItem extracts valid image metadata', () => {
  const event = createMockEvent({ id: 'img1', sender: '@alice:hs', ts: 1000 });
  const item = matrixEventToPhotoStackItem(event);
  assert.ok(item);
  assert.equal(item.eventId, 'img1');
  assert.equal(item.url, 'mxc://example.org/img1');
  assert.equal(item.body, 'Photo img1');

  const textEvent = createMockEvent({
    id: 'txt1',
    sender: '@alice:hs',
    ts: 1000,
    msgtype: 'm.text',
  });
  assert.equal(matrixEventToPhotoStackItem(textEvent), null);

  const redactedEvent = createMockEvent({
    id: 'red1',
    sender: '@alice:hs',
    ts: 1000,
    redacted: true,
  });
  assert.equal(matrixEventToPhotoStackItem(redactedEvent), null);
});

test('findPhotoCluster detects 3 consecutive photos into a cluster and marks followers as non-head', () => {
  const events = [
    createMockEvent({ id: 'p1', sender: '@alice:hs', ts: 10_000 }),
    createMockEvent({ id: 'p2', sender: '@alice:hs', ts: 15_000 }),
    createMockEvent({ id: 'p3', sender: '@alice:hs', ts: 20_000 }),
  ];

  const getEventAt = (idx: number) => events[idx];
  const getCount = () => events.length;

  const res0 = findPhotoCluster(0, getCount, getEventAt);
  assert.equal(res0.isHead, true);
  assert.ok(res0.cluster);
  assert.equal(res0.cluster.length, 3);
  assert.equal(res0.cluster[0].eventId, 'p1');
  assert.equal(res0.cluster[1].eventId, 'p2');
  assert.equal(res0.cluster[2].eventId, 'p3');

  const res1 = findPhotoCluster(1, getCount, getEventAt);
  assert.equal(res1.isHead, false);
  assert.equal(res1.cluster, null);

  const res2 = findPhotoCluster(2, getCount, getEventAt);
  assert.equal(res2.isHead, false);
  assert.equal(res2.cluster, null);
});

test('findPhotoCluster returns null cluster for single standalone photo', () => {
  const events = [
    createMockEvent({ id: 'txt1', sender: '@alice:hs', ts: 10_000, msgtype: 'm.text' }),
    createMockEvent({ id: 'p1', sender: '@alice:hs', ts: 15_000 }),
    createMockEvent({ id: 'txt2', sender: '@alice:hs', ts: 20_000, msgtype: 'm.text' }),
  ];

  const getEventAt = (idx: number) => events[idx];
  const getCount = () => events.length;

  const res = findPhotoCluster(1, getCount, getEventAt);
  assert.equal(res.isHead, true);
  assert.equal(res.cluster, null);
});

test('findPhotoCluster separates photos across different senders or >2min gap', () => {
  const events = [
    createMockEvent({ id: 'p1', sender: '@alice:hs', ts: 10_000 }),
    createMockEvent({ id: 'p2', sender: '@bob:hs', ts: 15_000 }),
    createMockEvent({ id: 'p3', sender: '@alice:hs', ts: 500_000 }), // > 2 min
  ];

  const getEventAt = (idx: number) => events[idx];
  const getCount = () => events.length;

  assert.equal(findPhotoCluster(0, getCount, getEventAt).cluster, null);
  assert.equal(findPhotoCluster(1, getCount, getEventAt).cluster, null);
  assert.equal(findPhotoCluster(2, getCount, getEventAt).cluster, null);
});

test('findPhotoCluster extracts internal content.images array if present', () => {
  const multiEvent = createMockEvent({
    id: 'multi1',
    sender: '@alice:hs',
    ts: 10_000,
    images: [
      { url: 'mxc://example.org/1', body: 'Garden 1' },
      { url: 'mxc://example.org/2', body: 'Garden 2' },
      { url: 'mxc://example.org/3', body: 'Garden 3' },
    ],
  });

  const res = findPhotoCluster(
    0,
    () => 1,
    () => multiEvent
  );
  assert.equal(res.isHead, true);
  assert.ok(res.cluster);
  assert.equal(res.cluster.length, 3);
  assert.equal(res.cluster[0].body, 'Garden 1');
  assert.equal(res.cluster[1].body, 'Garden 2');
  assert.equal(res.cluster[2].body, 'Garden 3');
});
