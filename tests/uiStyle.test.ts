import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_UI_FONT,
  DEFAULT_UI_STYLE,
  applyUiFontToElement,
  applyUiStyleToElement,
  getColorSchemeForTheme,
  parseUiFont,
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

test('parseUiFont defaults to atkinson and accepts valid fonts only', () => {
  assert.equal(DEFAULT_UI_FONT, 'atkinson');
  assert.equal(parseUiFont(undefined), 'atkinson');
  assert.equal(parseUiFont(null), 'atkinson');
  assert.equal(parseUiFont('roboto'), 'atkinson');
  assert.equal(parseUiFont(123), 'atkinson');
  assert.equal(parseUiFont('atkinson'), 'atkinson');
  assert.equal(parseUiFont('inter'), 'inter');
});

test('applyUiStyleToElement and applyUiFontToElement write root attributes safely', () => {
  const attrs = new Map<string, string>();
  const mockElement = {
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
  };

  applyUiStyleToElement(mockElement, 'classic');
  assert.equal(attrs.get('data-ui-style'), 'classic');

  applyUiStyleToElement(mockElement, 'invalid' as never);
  assert.equal(attrs.get('data-ui-style'), 'modern');

  applyUiFontToElement(mockElement, 'inter');
  assert.equal(attrs.get('data-ui-font'), 'inter');

  applyUiFontToElement(mockElement, 'invalid' as never);
  assert.equal(attrs.get('data-ui-font'), 'atkinson');
});

test('getColorSchemeForTheme maps built-in and custom themes cleanly', () => {
  assert.equal(getColorSchemeForTheme('light-theme'), 'light');
  assert.equal(getColorSchemeForTheme('silver-theme'), 'light');
  assert.equal(getColorSchemeForTheme('ayu-theme'), 'dark');
  assert.equal(getColorSchemeForTheme('classic-theme'), 'dark');
  assert.equal(getColorSchemeForTheme('dark-theme'), 'dark');
  assert.equal(getColorSchemeForTheme('butter-theme'), 'dark');
  assert.equal(getColorSchemeForTheme('custom-theme'), '');
  assert.equal(getColorSchemeForTheme('custom-theme', true), 'dark');
  assert.equal(getColorSchemeForTheme('custom-theme', false), 'light');
  assert.equal(getColorSchemeForTheme('unknown'), '');
});

test('folds@2.7.2 style.css contains expected Modern UI hook selectors', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(
    new URL('../node_modules/folds/dist/style.css', import.meta.url),
    'utf8'
  );
  for (const selector of [
    '.epr39zd',
    '.brs7ce5',
    '._1bv8u1w6',
    '._13qe89m6',
    '._1fc5sz51',
    '._1oc5jl82',
    '._1gp7uix9',
    '._1gp7uix2',
  ]) {
    assert.ok(css.includes(selector), `Expected ${selector} in folds stylesheet`);
  }
});
