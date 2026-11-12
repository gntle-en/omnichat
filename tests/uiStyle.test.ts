import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_UI_STYLE,
  applyUiStyleToElement,
  getColorSchemeForTheme,
  parseUiStyle,
} from '../src/util/uiStyle.ts';

test('parseUiStyle defaults to modern and accepts valid styles only', () => {
  assert.equal(DEFAULT_UI_STYLE, 'modern');
  assert.equal(parseUiStyle(undefined), 'modern');
  assert.equal(parseUiStyle(null), 'modern');
  assert.equal(parseUiStyle('sleek'), 'modern');
  assert.equal(parseUiStyle(42), 'modern');
  assert.equal(parseUiStyle('modern'), 'modern');
  assert.equal(parseUiStyle('classic'), 'classic');
});

test('applyUiStyleToElement writes data-ui-style attribute safely', () => {
  const attrs = new Map<string, string>();
  const mockElement = {
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
  };

  applyUiStyleToElement(mockElement, 'classic');
  assert.equal(attrs.get('data-ui-style'), 'classic');

  applyUiStyleToElement(mockElement, 'modern');
  assert.equal(attrs.get('data-ui-style'), 'modern');

  applyUiStyleToElement(mockElement, 'invalid' as never);
  assert.equal(attrs.get('data-ui-style'), 'modern');
});

test('getColorSchemeForTheme maps built-in themes and leaves custom unset', () => {
  assert.equal(getColorSchemeForTheme('light'), 'light');
  assert.equal(getColorSchemeForTheme('silver'), 'light');
  assert.equal(getColorSchemeForTheme('ayu'), 'dark');
  assert.equal(getColorSchemeForTheme('classic'), 'dark');
  assert.equal(getColorSchemeForTheme('butter'), 'dark');
  assert.equal(getColorSchemeForTheme('custom'), '');
  assert.equal(getColorSchemeForTheme('unknown'), '');
});
