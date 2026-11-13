import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_CUSTOM_UI,
  DEFAULT_UI_FONT,
  DEFAULT_UI_STYLE,
  applyCustomUiSettingsToElement,
  applyUiFontToElement,
  applyUiStyleToElement,
  clearCustomUiSettingsFromElement,
  getColorSchemeForTheme,
  isLightColor,
  parseCustomUiSettings,
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
  assert.equal(parseUiStyle('custom'), 'custom');
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

test('isLightColor calculates contrast luminance accurately for 3 and 6 digit hex', () => {
  assert.equal(isLightColor('#FFFFFF'), true);
  assert.equal(isLightColor('#FFF'), true);
  assert.equal(isLightColor('#E9E9EB'), true);
  assert.equal(isLightColor('#000000'), false);
  assert.equal(isLightColor('#000'), false);
  assert.equal(isLightColor('#007AFF'), false);
  assert.equal(isLightColor('#1B2234'), false);
  assert.equal(isLightColor('invalid'), false);
});

test('parseCustomUiSettings returns defaults for invalid or partial input and validates enum values', () => {
  assert.deepEqual(parseCustomUiSettings(null), DEFAULT_CUSTOM_UI);
  assert.deepEqual(parseCustomUiSettings(undefined), DEFAULT_CUSTOM_UI);

  const custom = parseCustomUiSettings({
    avatarShape: 'squircle',
    bubbleRadius: 'subtle',
    bubbleAlignment: 'left',
    bubbleTail: false,
    outgoingColor: 'surface',
    incomingColor: '#1B2234',
    backdropBlur: false,
    buttonShape: 'sharp',
  });

  assert.equal(custom.avatarShape, 'squircle');
  assert.equal(custom.bubbleRadius, 'subtle');
  assert.equal(custom.bubbleAlignment, 'left');
  assert.equal(custom.bubbleTail, false);
  assert.equal(custom.outgoingColor, 'surface');
  assert.equal(custom.incomingColor, '#1B2234');
  assert.equal(custom.backdropBlur, false);
  assert.equal(custom.buttonShape, 'sharp');
});

test('applyCustomUiSettingsToElement and clearCustomUiSettingsFromElement set and remove CSS variables', () => {
  const vars = new Map<string, string>();
  const mockElement = {
    style: {
      setProperty(name: string, value: string) {
        vars.set(name, value);
      },
      removeProperty(name: string) {
        vars.delete(name);
      },
    },
  };

  applyCustomUiSettingsToElement(mockElement, {
    avatarShape: 'circle',
    bubbleRadius: 'pill',
    bubbleAlignment: 'split',
    bubbleTail: true,
    outgoingColor: '#007AFF',
    incomingColor: '#E9E9EB',
    backdropBlur: true,
    buttonShape: 'pill',
  });

  assert.equal(vars.get('--omni-avatar-radius'), '50%');
  assert.equal(vars.get('--omni-bubble-radius'), '18px');
  assert.equal(vars.get('--omni-bubble-tail-radius'), '4px');
  assert.equal(vars.get('--omni-bubble-alignment'), 'split');
  assert.equal(vars.get('--omni-bubble-outgoing-bg'), '#007AFF');
  assert.equal(vars.get('--omni-bubble-outgoing-color'), '#FFFFFF');
  assert.equal(vars.get('--omni-bubble-incoming-bg'), '#E9E9EB');
  // Light incoming background gets dark text
  assert.equal(vars.get('--omni-bubble-incoming-color'), '#111111');
  assert.equal(vars.get('--omni-backdrop-blur'), 'blur(6px)');
  assert.equal(vars.get('--omni-button-radius'), '9999px');

  clearCustomUiSettingsFromElement(mockElement);
  assert.equal(vars.size, 0);
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

  applyUiStyleToElement(mockElement, 'custom');
  assert.equal(attrs.get('data-ui-style'), 'custom');

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
