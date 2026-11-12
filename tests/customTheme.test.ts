import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyCustomThemeToElement,
  fetchCustomThemeFromUrl,
  parseCustomThemeJson,
} from '../src/app/utils/customTheme.ts';

test('parseCustomThemeJson parses Element theme JSON and infers dark/light scale', () => {
  const elementTheme = JSON.stringify({
    name: 'Nordic Night',
    is_dark: true,
    colors: {
      'timeline-background-color': '#2E3440',
      'roomlist-background-color': '#272C36',
      'sidebar-color': '#20252E',
      'primary-color': '#88C0D0',
      'timeline-text-color': '#ECEFF4',
      alert: '#BF616A',
      'warning-color': '#EBCB8B',
      'username-colors': ['#88C0D0', '#81A1C1'],
    },
  });

  const parsed = parseCustomThemeJson(elementTheme);
  assert.equal(parsed.name, 'Nordic Night');
  assert.equal(parsed.isDark, true);
  assert.equal(parsed.palette.Surface.Container, '#2E3440');
  assert.equal(parsed.palette.Background.Container, '#20252E');
  assert.equal(parsed.palette.Primary.Main, '#88C0D0');
  assert.equal(parsed.palette.Surface.OnContainer, '#ECEFF4');
  assert.deepEqual(parsed.userColors, ['#88C0D0', '#81A1C1']);
});

test('parseCustomThemeJson parses legacy Variance ThemeStyle JSON', () => {
  const legacyTheme = JSON.stringify({
    name: 'Legacy Midnight',
    style: {
      background: {
        surface: '#0B0E14',
        surface_low: '#0F131A',
        surface_extra_low: '#11151C',
        primary: '#2A62A6',
      },
      text_color: {
        surface: {
          high: '#FFFBDE',
        },
        link: '#59C2FF',
      },
    },
  });

  const parsed = parseCustomThemeJson(legacyTheme);
  assert.equal(parsed.name, 'Legacy Midnight');
  assert.equal(parsed.isDark, true);
  assert.equal(parsed.palette.Surface.Container, '#0B0E14');
  assert.equal(parsed.palette.Background.Container, '#11151C');
  assert.equal(parsed.linkColor, '#59C2FF');
});

test('parseCustomThemeJson parses OmniChat folds palette overrides and rejects invalid input', () => {
  const foldsTheme = JSON.stringify({
    name: 'Paper Light',
    kind: 'light',
    palette: {
      Surface: { Container: '#FAF8F5' },
      Primary: { Main: '#0B57D0' },
    },
  });

  const parsed = parseCustomThemeJson(foldsTheme);
  assert.equal(parsed.name, 'Paper Light');
  assert.equal(parsed.isDark, false);
  assert.equal(parsed.palette.Surface.Container, '#FAF8F5');
  assert.equal(parsed.palette.Primary.Main, '#0B57D0');

  assert.throws(() => parseCustomThemeJson('not json'));
  assert.throws(() => parseCustomThemeJson('{}'));
});

test('applyCustomThemeToElement sets and clears folds color vars and overrides', () => {
  const props = new Map<string, string>();
  const mockEl = {
    style: {
      setProperty(name: string, value: string) {
        props.set(name, value);
      },
      removeProperty(name: string) {
        props.delete(name);
      },
    } as unknown as CSSStyleDeclaration,
  };

  const parsed = parseCustomThemeJson(
    JSON.stringify({
      name: 'Test',
      kind: 'dark',
      linkColor: '#123456',
      userColors: ['#111111', '#222222'],
      palette: {
        Surface: { Container: '#101010' },
      },
    })
  );

  applyCustomThemeToElement(mockEl, parsed);
  assert.equal(props.get('--tc-link'), '#123456');
  assert.equal(props.get('--mx-uc-1'), '#111111');
  assert.equal(props.get('--mx-uc-2'), '#222222');
  assert.equal(props.get('--mx-uc-3'), undefined);
  assert.ok(Array.from(props.values()).includes('#101010'));

  applyCustomThemeToElement(mockEl, null);
  assert.equal(props.size, 0);
});

test('fetchCustomThemeFromUrl rejects invalid and non-http(s) URLs', async () => {
  await assert.rejects(() => fetchCustomThemeFromUrl('not-a-url'));
  await assert.rejects(() => fetchCustomThemeFromUrl('javascript:alert(1)'));
  await assert.rejects(() => fetchCustomThemeFromUrl('file:///etc/passwd'));
});
