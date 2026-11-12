import assert from 'node:assert/strict';
import test from 'node:test';
import { getNextRoomNavIndex, getSpaceHotkeyIndex } from '../src/util/hotkeys.ts';

test('getNextRoomNavIndex moves up and down within bounds', () => {
  assert.equal(getNextRoomNavIndex(0, 3, 'up'), null);
  assert.equal(getNextRoomNavIndex(0, 3, 'down'), 1);
  assert.equal(getNextRoomNavIndex(2, 3, 'down'), null);
  assert.equal(getNextRoomNavIndex(2, 3, 'up'), 1);
});

test('getNextRoomNavIndex selects edge when no room is currently active', () => {
  assert.equal(getNextRoomNavIndex(-1, 4, 'down'), 0);
  assert.equal(getNextRoomNavIndex(-1, 4, 'up'), 3);
  assert.equal(getNextRoomNavIndex(-1, 0, 'down'), null);
});

test('getSpaceHotkeyIndex resolves 1-9 digits within available spaces', () => {
  assert.equal(getSpaceHotkeyIndex('1', 4), 0);
  assert.equal(getSpaceHotkeyIndex('4', 4), 3);
  assert.equal(getSpaceHotkeyIndex('5', 4), null);
  assert.equal(getSpaceHotkeyIndex('0', 4), null);
  assert.equal(getSpaceHotkeyIndex('a', 4), null);
});
