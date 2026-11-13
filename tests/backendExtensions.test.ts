import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_SEND_LATER_PRESETS,
  EXTENSION_SCHEMA_VERSION,
  computeScheduleDelayMs,
  getDelayUntilNextMidnight,
  interpolateTemplate,
  isActionAvailable,
  isSafeHttpUrl,
  parseBackendExtensionsJson,
  resolveBackendExtensions,
  resolvePresetDelayMs,
} from '../src/util/backendExtensions.ts';

test('resolveBackendExtensions enables sendLater automatically when MSC4140 is advertised', () => {
  const manifest = resolveBackendExtensions({
    unstableFeatures: {
      'org.matrix.msc4140': true,
    },
  });

  assert.equal(manifest.schemaVersion, EXTENSION_SCHEMA_VERSION);
  assert.equal(manifest.sendLater.enabled, true);
  assert.equal(manifest.sendLater.transport, 'msc4140');
  assert.equal(manifest.deletedMessages.mode, 'hide');
  assert.ok(manifest.sources.includes('versions:org.matrix.msc4140'));
});

test('resolveBackendExtensions applies discovery precedence and merges actions by id', () => {
  const manifest = resolveBackendExtensions({
    clientConfigExtensions: {
      schemaVersion: 1,
      deletedMessages: { mode: 'placeholder' },
      actions: [
        {
          id: 'triage',
          slot: 'message.contextMenu',
          label: 'Config Label',
          transport: {
            type: 'http_rpc',
            endpoint: 'https://agent.example.com/v1',
          },
        },
      ],
    },
    capabilities: {
      'dev.omnichat.extensions': {
        schemaVersion: 1,
        deletedMessages: { mode: 'inline-red', showReason: false },
        actions: [
          {
            id: 'triage',
            slot: 'message.contextMenu',
            label: 'Server Override Label',
            transport: {
              type: 'matrix_event',
              eventType: 'dev.omnichat.agent.task',
            },
          },
          {
            id: 'room-digest',
            slot: 'room.headerActions',
            label: 'Room Digest',
            transport: {
              type: 'http_rpc',
              endpoint: 'https://agent.example.com/digest',
              resultHandling: 'notify',
            },
          },
        ],
      },
    },
    developerOverrideJson: JSON.stringify({
      schemaVersion: 1,
      sendLater: {
        enabled: true,
        transport: 'http_rpc',
        endpoint: 'https://scheduler.example.com/schedule',
      },
    }),
  });

  assert.equal(manifest.deletedMessages.mode, 'inline-red');
  assert.equal(manifest.deletedMessages.showReason, false);
  assert.equal(manifest.sendLater.enabled, true);
  assert.equal(manifest.sendLater.transport, 'http_rpc');
  assert.equal(manifest.actions.length, 2);
  assert.equal(manifest.actions[0].label, 'Server Override Label');
  assert.equal(manifest.actions[0].transport.type, 'matrix_event');
  assert.equal(manifest.actions[1].id, 'room-digest');
});

test('resolveBackendExtensions drops unsafe javascript or data URLs', () => {
  assert.equal(isSafeHttpUrl('https://example.com/hook'), true);
  assert.equal(isSafeHttpUrl('http://localhost:8080/hook'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<script>'), false);

  const manifest = resolveBackendExtensions({
    capabilities: {
      'dev.omnichat.extensions': {
        schemaVersion: 1,
        actions: [
          {
            id: 'bad-rpc',
            slot: 'composer.actions',
            label: 'Bad RPC',
            transport: {
              type: 'http_rpc',
              endpoint: 'javascript:alert(1)',
            },
          },
          {
            id: 'bad-widget',
            slot: 'room.headerActions',
            label: 'Bad Widget',
            transport: {
              type: 'widget_modal',
              url: 'data:text/html,hi',
            },
          },
        ],
      },
    },
  });

  assert.equal(manifest.actions.length, 0);
});

test('parseBackendExtensionsJson validates JSON objects', () => {
  assert.deepEqual(parseBackendExtensionsJson(''), { manifest: null, error: null });
  const badSyntax = parseBackendExtensionsJson('{invalid');
  assert.equal(badSyntax.manifest, null);
  assert.ok(badSyntax.error);
  const nonObject = parseBackendExtensionsJson('[1, 2, 3]');
  assert.equal(nonObject.error, 'Manifest root must be a JSON object.');
});

test('interpolateTemplate replaces nested variables and computeScheduleDelayMs validates future dates', () => {
  const result = interpolateTemplate(
    {
      room_id: '{{roomId}}',
      nested: ['{{eventId}}', 'User {{field.tone}}'],
    },
    {
      roomId: '!room:example.org',
      eventId: '$ev1',
      'field.tone': 'concise',
    }
  );
  assert.deepEqual(result, {
    room_id: '!room:example.org',
    nested: ['$ev1', 'User concise'],
  });

  const now = Date.UTC(2026, 10, 12, 12, 0, 0);
  assert.equal(computeScheduleDelayMs('2026-11-12T12:10:00Z', now), 600_000);
  assert.equal(computeScheduleDelayMs('2026-11-12T11:59:00Z', now), null);
});

test('getDelayUntilNextMidnight and resolvePresetDelayMs compute accurate 12am next day birthday delays', () => {
  const mockNow = new Date('2026-11-13T18:30:00.000Z');
  const expectedMidnight = new Date(mockNow);
  expectedMidnight.setDate(expectedMidnight.getDate() + 1);
  expectedMidnight.setHours(0, 0, 0, 0);
  const expectedDelay = expectedMidnight.getTime() - mockNow.getTime();

  assert.equal(getDelayUntilNextMidnight(mockNow), expectedDelay);

  const midnightPreset = DEFAULT_SEND_LATER_PRESETS.find((p) => p.id === 'midnight_next_day');
  assert.ok(midnightPreset, 'Expected midnight_next_day preset in defaults');
  assert.equal(resolvePresetDelayMs(midnightPreset, mockNow), expectedDelay);

  const fixedPreset = { id: '1h', label: 'In 1 hour', delayMs: 3600000 };
  assert.equal(resolvePresetDelayMs(fixedPreset, mockNow), 3600000);
});

test('isActionAvailable enforces room, encryption, power level, and ownership filters', () => {
  const action = resolveBackendExtensions({
    clientConfigExtensions: {
      schemaVersion: 1,
      actions: [
        {
          id: 'mod-action',
          slot: 'message.contextMenu',
          label: 'Mod Action',
          transport: { type: 'matrix_event', eventType: 'dev.omnichat.mod' },
          availability: {
            roomTypes: ['group'],
            requiresEncryption: false,
            requiresPowerLevel: 50,
            ownMessagesOnly: false,
          },
        },
      ],
    },
  }).actions[0];

  assert.equal(
    isActionAvailable(action, {
      roomType: 'group',
      isEncrypted: false,
      userPowerLevel: 50,
    }),
    true
  );
  assert.equal(
    isActionAvailable(action, {
      roomType: 'dm',
      isEncrypted: false,
      userPowerLevel: 100,
    }),
    false
  );
  assert.equal(
    isActionAvailable(action, {
      roomType: 'group',
      isEncrypted: false,
      userPowerLevel: 10,
    }),
    false
  );
});
