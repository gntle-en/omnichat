import assert from 'node:assert/strict';
import test from 'node:test';
import { getPerMessageProfile, hasSameEffectiveSender } from '../src/util/perMessageProfile.ts';

test('getPerMessageProfile extracts MSC4144 displayname and valid mxc avatar_url', () => {
  assert.deepEqual(
    getPerMessageProfile({
      msgtype: 'm.text',
      body: 'hi',
      'com.beeper.per_message_profile': {
        displayname: 'Discord User',
        avatar_url: 'mxc://example.org/avatar1',
      },
    }),
    {
      displayname: 'Discord User',
      avatarUrl: 'mxc://example.org/avatar1',
    }
  );

  assert.deepEqual(
    getPerMessageProfile({
      'com.beeper.per_message_profile': {
        displayname: 'Only Name',
        avatar_url: 'https://invalid.example/not-mxc',
      },
    }),
    {
      displayname: 'Only Name',
      avatarUrl: undefined,
    }
  );

  assert.equal(getPerMessageProfile({ body: 'plain' }), undefined);
});

test('hasSameEffectiveSender prevents collapsing bridged messages across different virtual senders', () => {
  assert.equal(hasSameEffectiveSender('@bot:ex', { body: 'a' }, '@bot:ex', { body: 'b' }), true);
  assert.equal(
    hasSameEffectiveSender(
      '@bot:ex',
      { 'com.beeper.per_message_profile': { displayname: 'Alice', avatar_url: 'mxc://ex/1' } },
      '@bot:ex',
      { 'com.beeper.per_message_profile': { displayname: 'Bob', avatar_url: 'mxc://ex/2' } }
    ),
    false
  );
  assert.equal(
    hasSameEffectiveSender(
      '@bot:ex',
      { 'com.beeper.per_message_profile': { displayname: 'Alice' } },
      '@bot:ex',
      { 'com.beeper.per_message_profile': { displayname: 'Alice' } }
    ),
    true
  );
});

