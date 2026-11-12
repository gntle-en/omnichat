import assert from 'node:assert/strict';
import test from 'node:test';
import { htmlToPlainFallback, textToHtmlRainbow } from '../src/util/rainbow.ts';

test('textToHtmlRainbow handles empty input safely', () => {
  assert.equal(textToHtmlRainbow(''), '');
});

test('textToHtmlRainbow colors non-space characters with valid hex tags and preserves spaces', () => {
  const result = textToHtmlRainbow('hi there');
  assert.match(result, /^(<font color="#[0-9a-f]{6}">.<\/font>| )+$/);
  assert.ok(result.includes('</font> <font color="#'));
});

test('textToHtmlRainbow escapes HTML special characters inside colored segments', () => {
  const result = textToHtmlRainbow('a<b&>');
  assert.ok(result.includes('&lt;'));
  assert.ok(result.includes('&amp;'));
  assert.ok(result.includes('&gt;'));
  assert.ok(!result.includes('><<'));
});

test('htmlToPlainFallback extracts readable fallback text', () => {
  assert.equal(htmlToPlainFallback('<b>hello</b> <i>world</i>'), 'hello world');
  assert.equal(htmlToPlainFallback('<hr/>'), '<hr/>');
});

