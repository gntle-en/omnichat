import chroma from 'chroma-js';
import { color } from 'folds';
import type { AccentScale, SurfaceScale, ThemePalette } from '../../themePalettes';
import { ayuPalette, darkPalette, lightPalette } from '../../themePalettes';

export interface CustomThemePayload {
  name: string;
  isDark: boolean;
  palette: ThemePalette;
  linkColor?: string;
  userColors?: string[];
}

type RecordObject = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const validColor = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || !chroma.valid(trimmed)) return undefined;
  return trimmed;
};

const shiftShade = (baseHex: string, isDark: boolean, step: number): string =>
  isDark ? chroma(baseHex).brighten(step).hex() : chroma(baseHex).darken(step).hex();

const pickOnColor = (bgHex: string): string =>
  chroma.contrast(bgHex, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#111111';

function deriveSurfaceScale(
  containerColor: string,
  textColor: string,
  isDark: boolean,
  fallback: SurfaceScale
): SurfaceScale {
  if (!chroma.valid(containerColor)) return fallback;
  return {
    Container: containerColor,
    ContainerHover: shiftShade(containerColor, isDark, 0.25),
    ContainerActive: shiftShade(containerColor, isDark, 0.45),
    ContainerLine: shiftShade(containerColor, isDark, 0.7),
    OnContainer: chroma.valid(textColor) ? textColor : fallback.OnContainer,
  };
}

function deriveAccentScale(
  mainColor: string,
  surfaceHex: string,
  isDark: boolean,
  fallback: AccentScale
): AccentScale {
  if (!chroma.valid(mainColor)) return fallback;
  const softContainer = chroma.mix(surfaceHex, mainColor, isDark ? 0.28 : 0.16).hex();
  return {
    Main: mainColor,
    MainHover: shiftShade(mainColor, isDark, 0.25),
    MainActive: shiftShade(mainColor, isDark, 0.45),
    MainLine: shiftShade(mainColor, isDark, 0.65),
    OnMain: pickOnColor(mainColor),
    Container: softContainer,
    ContainerHover: shiftShade(softContainer, isDark, 0.2),
    ContainerActive: shiftShade(softContainer, isDark, 0.35),
    ContainerLine: shiftShade(softContainer, isDark, 0.55),
    OnContainer: isDark
      ? chroma.mix(mainColor, '#FFFFFF', 0.65).hex()
      : shiftShade(mainColor, false, 0.9),
  };
}

function mergeScale<T extends Record<string, string>>(base: T, override: unknown): T {
  if (!isRecord(override)) return base;
  const merged: Record<string, string> = { ...base };
  Object.keys(base).forEach((key) => {
    const val = validColor(override[key]);
    if (val) merged[key] = val;
  });
  return merged as T;
}

function mergePalette(base: ThemePalette, source: RecordObject): ThemePalette {
  return {
    Background: mergeScale(base.Background, source.Background),
    Surface: mergeScale(base.Surface, source.Surface),
    SurfaceVariant: mergeScale(base.SurfaceVariant, source.SurfaceVariant),
    Primary: mergeScale(base.Primary, source.Primary),
    Secondary: mergeScale(base.Secondary, source.Secondary),
    Success: mergeScale(base.Success, source.Success),
    Warning: mergeScale(base.Warning, source.Warning),
    Critical: mergeScale(base.Critical, source.Critical),
    Other: mergeScale(base.Other, source.Other),
  };
}

function inferDarkMode(obj: RecordObject, hintColor?: string): boolean {
  if (typeof obj.is_dark === 'boolean') return obj.is_dark;
  if (typeof obj.isDark === 'boolean') return obj.isDark;
  if (obj.kind === 'dark') return true;
  if (obj.kind === 'light') return false;
  if (hintColor && chroma.valid(hintColor)) {
    return chroma(hintColor).luminance() < 0.35;
  }
  return true;
}

function parseElementTheme(root: RecordObject, colors: RecordObject): CustomThemePayload {
  const surface = validColor(colors['timeline-background-color']);
  const bg = validColor(colors['sidebar-color']) ?? validColor(colors['roomlist-background-color']);
  const roomBg = validColor(colors['roomlist-background-color']) ?? surface ?? bg;
  const isDark = inferDarkMode(root, surface ?? bg);
  const base = isDark ? darkPalette : lightPalette;

  const surfaceHex = surface ?? base.Surface.Container;
  const bgHex = bg ?? roomBg ?? base.Background.Container;
  const variantHex =
    validColor(colors['room-highlight-color']) ??
    validColor(colors['roomlist-highlights-color']) ??
    shiftShade(surfaceHex, isDark, 0.35);
  const textHex = validColor(colors['timeline-text-color']) ?? base.Surface.OnContainer;
  const accentHex =
    validColor(colors['primary-color']) ?? validColor(colors['accent-color']) ?? base.Primary.Main;
  const warningHex = validColor(colors['warning-color']);
  const alertHex = validColor(colors.alert);

  const userColors = Array.isArray(colors['username-colors'])
    ? colors['username-colors']
        .map(validColor)
        .filter((c): c is string => Boolean(c))
        .slice(0, 8)
    : undefined;

  return {
    name: typeof root.name === 'string' && root.name.trim() ? root.name.trim() : 'Custom',
    isDark,
    linkColor: accentHex !== base.Primary.Main ? accentHex : undefined,
    userColors: userColors && userColors.length > 0 ? userColors : undefined,
    palette: {
      Background: deriveSurfaceScale(bgHex, textHex, isDark, base.Background),
      Surface: deriveSurfaceScale(surfaceHex, textHex, isDark, base.Surface),
      SurfaceVariant: deriveSurfaceScale(variantHex, textHex, isDark, base.SurfaceVariant),
      Primary: deriveAccentScale(accentHex, surfaceHex, isDark, base.Primary),
      Secondary: base.Secondary,
      Success: base.Success,
      Warning: warningHex
        ? deriveAccentScale(warningHex, surfaceHex, isDark, base.Warning)
        : base.Warning,
      Critical: alertHex
        ? deriveAccentScale(alertHex, surfaceHex, isDark, base.Critical)
        : base.Critical,
      Other: base.Other,
    },
  };
}

function parseLegacyVarianceTheme(root: RecordObject, style: RecordObject): CustomThemePayload {
  const bg = isRecord(style.background) ? style.background : {};
  const tc = isRecord(style.text_color) ? style.text_color : {};
  const tcSurface = isRecord(tc.surface) ? tc.surface : {};

  const surface = validColor(bg.surface);
  const bgExtraLow = validColor(bg.surface_extra_low) ?? validColor(bg.surface_low) ?? surface;
  const bgLow =
    validColor(bg.surface_low) ?? shiftShade(surface ?? bgExtraLow ?? '#1A1A1A', true, 0.3);
  const isDark = inferDarkMode(root, surface ?? bgExtraLow);
  const base = isDark ? ayuPalette : lightPalette;

  const surfaceHex = surface ?? base.Surface.Container;
  const bgHex = bgExtraLow ?? base.Background.Container;
  const textHex =
    validColor(tcSurface.high) ?? validColor(tcSurface.normal) ?? base.Surface.OnContainer;
  const primaryHex = validColor(bg.primary) ?? base.Primary.Main;

  const userColors = Array.isArray(style.user_colors)
    ? style.user_colors
        .map(validColor)
        .filter((c): c is string => Boolean(c))
        .slice(0, 8)
    : undefined;

  return {
    name: typeof root.name === 'string' && root.name.trim() ? root.name.trim() : 'Custom',
    isDark,
    linkColor: validColor(tc.link),
    userColors: userColors && userColors.length > 0 ? userColors : undefined,
    palette: {
      Background: deriveSurfaceScale(bgHex, textHex, isDark, base.Background),
      Surface: deriveSurfaceScale(surfaceHex, textHex, isDark, base.Surface),
      SurfaceVariant: deriveSurfaceScale(bgLow, textHex, isDark, base.SurfaceVariant),
      Primary: deriveAccentScale(primaryHex, surfaceHex, isDark, base.Primary),
      Secondary: base.Secondary,
      Success: base.Success,
      Warning: base.Warning,
      Critical: base.Critical,
      Other: base.Other,
    },
  };
}

function hasFoldsPaletteKeys(obj: RecordObject): boolean {
  return (
    isRecord(obj.Background) ||
    isRecord(obj.Surface) ||
    isRecord(obj.SurfaceVariant) ||
    isRecord(obj.Primary) ||
    isRecord(obj.Secondary)
  );
}

/**
 * Parse a custom theme JSON string in Element, legacy Variance/Cinny v2, or folds palette format.
 */
export function parseCustomThemeJson(rawJson: string): CustomThemePayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Theme JSON is not valid JSON.');
  }

  if (!isRecord(parsed)) {
    throw new Error('Theme JSON must be a JSON object.');
  }

  if (isRecord(parsed.colors) && !hasFoldsPaletteKeys(parsed.colors)) {
    return parseElementTheme(parsed, parsed.colors);
  }

  if (isRecord(parsed.style)) {
    return parseLegacyVarianceTheme(parsed, parsed.style);
  }

  let paletteSource: RecordObject = parsed;
  if (isRecord(parsed.palette)) {
    paletteSource = parsed.palette;
  } else if (isRecord(parsed.colors)) {
    paletteSource = parsed.colors;
  }

  if (!hasFoldsPaletteKeys(paletteSource)) {
    throw new Error('Unrecognized theme JSON schema. Expected colors, style, or palette sections.');
  }

  const hintSurface = isRecord(paletteSource.Surface)
    ? validColor(paletteSource.Surface.Container)
    : undefined;
  const hintBg = isRecord(paletteSource.Background)
    ? validColor(paletteSource.Background.Container)
    : undefined;
  const isDark = inferDarkMode(parsed, hintSurface ?? hintBg);
  const base = isDark ? darkPalette : lightPalette;

  const userColors = Array.isArray(parsed.userColors)
    ? parsed.userColors
        .map(validColor)
        .filter((c): c is string => Boolean(c))
        .slice(0, 8)
    : undefined;

  return {
    name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Custom',
    isDark,
    linkColor: validColor(parsed.linkColor),
    userColors: userColors && userColors.length > 0 ? userColors : undefined,
    palette: mergePalette(base, paletteSource),
  };
}

/** Validate an HTTP/HTTPS URL and fetch + parse its custom theme JSON. */
export async function fetchCustomThemeFromUrl(rawUrl: string): Promise<CustomThemePayload> {
  const trimmed = rawUrl.trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new Error('Please enter a valid http:// or https:// theme URL.');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Only http:// and https:// theme URLs are supported.');
  }

  const response = await fetch(parsedUrl.toString());
  if (!response.ok) {
    throw new Error(`Failed to load theme (HTTP ${response.status}).`);
  }

  const text = await response.text();
  return parseCustomThemeJson(text);
}

const USER_COLOR_COUNT = 8;

function applyNestedColorVars(
  styleTarget: CSSStyleDeclaration,
  contractNode: Record<string, unknown>,
  valueNode: Record<string, unknown> | null
): void {
  Object.keys(contractNode).forEach((key) => {
    const token = contractNode[key];
    const nextValue = valueNode ? valueNode[key] : undefined;

    if (typeof token === 'string') {
      const match = /^var\((--[^,)]+)\)$/.exec(token);
      if (!match) return;
      const cssVar = match[1];
      if (typeof nextValue === 'string') {
        styleTarget.setProperty(cssVar, nextValue);
      } else {
        styleTarget.removeProperty(cssVar);
      }
      return;
    }

    if (isRecord(token)) {
      applyNestedColorVars(styleTarget, token, isRecord(nextValue) ? nextValue : null);
    }
  });
}

/**
 * Apply or clear inline Vanilla Extract color tokens and link/MXID overrides for custom themes.
 */
export function applyCustomThemeToElement(
  element: Pick<HTMLElement, 'style'>,
  customTheme: CustomThemePayload | null
): void {
  const { style } = element;
  applyNestedColorVars(
    style,
    color as unknown as Record<string, unknown>,
    customTheme ? (customTheme.palette as unknown as Record<string, unknown>) : null
  );

  if (customTheme?.linkColor) {
    style.setProperty('--tc-link', customTheme.linkColor);
  } else {
    style.removeProperty('--tc-link');
  }

  for (let i = 0; i < USER_COLOR_COUNT; i += 1) {
    const varName = `--mx-uc-${i + 1}`;
    const uc = customTheme?.userColors?.[i];
    if (uc) {
      style.setProperty(varName, uc);
    } else {
      style.removeProperty(varName);
    }
  }
}
