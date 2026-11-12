// Adapted from SchildiChat colour utilities (legacy Variance 0cc23102)

function adjustXYZ(v: number): number {
  if (v > 0.2069) {
    return v ** 3;
  }
  return 0.1284 * v - 0.01771;
}

function gammaCorrection(v: number): number {
  if (v <= 0.0031308) {
    return 12.92 * v;
  }
  return 1.055 * v ** (1 / 2.4) - 0.055;
}

function adjustRGB(v: number): number {
  const corrected = gammaCorrection(v);
  const limited = Math.min(Math.max(corrected, 0), 1);
  return Math.round(limited * 255);
}

function generateAB(hue: number, chroma: number): [number, number] {
  const a = chroma * 127 * Math.cos(hue);
  const b = chroma * 127 * Math.sin(hue);
  return [a, b];
}

function labToRGB(l: number, a: number, b: number): [number, number, number] {
  let y = (l + 16) / 116;
  const x = adjustXYZ(y + a / 500) * 0.9505;
  const z = adjustXYZ(y - b / 200) * 1.089;

  y = adjustXYZ(y);

  const red = 3.24096994 * x - 1.53738318 * y - 0.49861076 * z;
  const green = -0.96924364 * x + 1.8759675 * y + 0.04155506 * z;
  const blue = 0.05563008 * x - 0.20397696 * y + 1.05697151 * z;

  return [adjustRGB(red), adjustRGB(green), adjustRGB(blue)];
}

function escapeHtmlChar(ch: string): string {
  switch (ch) {
    case '&':
      return '&amp;';
    case '<':
      return '&lt;';
    case '>':
      return '&gt;';
    default:
      return ch;
  }
}

export function textToHtmlRainbow(str: string): string {
  const chars = Array.from(str);
  if (chars.length === 0) return '';

  const frequency = (2 * Math.PI) / chars.length;

  return chars
    .map((c, i) => {
      if (c === ' ' || c === '\n') {
        return c;
      }
      const [a, b] = generateAB(i * frequency, 1);
      const [red, green, blue] = labToRGB(75, a, b);

      const redHex = red.toString(16).padStart(2, '0');
      const greenHex = green.toString(16).padStart(2, '0');
      const blueHex = blue.toString(16).padStart(2, '0');

      return `<font color="#${redHex}${greenHex}${blueHex}">${escapeHtmlChar(c)}</font>`;
    })
    .join('');
}

export function htmlToPlainFallback(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const text = doc.body.textContent?.trim();
    if (text) return text;
  }
  const stripped = html.replace(/<[^>]+>/g, '').trim();
  return stripped || html;
}
