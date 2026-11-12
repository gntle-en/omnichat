export type UiStyle = 'modern' | 'classic';
export type UiFont = 'atkinson' | 'inter';

export const DEFAULT_UI_STYLE: UiStyle = 'modern';
export const DEFAULT_UI_FONT: UiFont = 'atkinson';

/** Normalize a persisted UI style value to a supported UiStyle. */
export function parseUiStyle(value: unknown): UiStyle {
  return value === 'classic' || value === 'modern' ? value : DEFAULT_UI_STYLE;
}

/** Normalize a persisted UI font value to a supported UiFont. */
export function parseUiFont(value: unknown): UiFont {
  return value === 'inter' || value === 'atkinson' ? value : DEFAULT_UI_FONT;
}

/** Set the root data-ui-style attribute to toggle Modern vs Classic CSS rules. */
export function applyUiStyleToElement(
  element: Pick<HTMLElement, 'setAttribute'>,
  uiStyle: UiStyle
): void {
  element.setAttribute('data-ui-style', parseUiStyle(uiStyle));
}

/** Set the root data-ui-font attribute to toggle Atkinson Hyperlegible vs Inter. */
export function applyUiFontToElement(
  element: Pick<HTMLElement, 'setAttribute'>,
  uiFont: UiFont
): void {
  element.setAttribute('data-ui-font', parseUiFont(uiFont));
}

const LIGHT_THEME_IDS = new Set(['light', 'light-theme', 'silver', 'silver-theme']);
const DARK_THEME_IDS = new Set([
  'ayu',
  'ayu-theme',
  'classic',
  'classic-theme',
  'dark',
  'dark-theme',
  'butter',
  'butter-theme',
]);

/** Resolve browser color-scheme metadata for built-in and custom theme IDs. */
export function getColorSchemeForTheme(
  themeId: string,
  customThemeIsDark?: boolean
): 'light' | 'dark' | '' {
  if (LIGHT_THEME_IDS.has(themeId)) return 'light';
  if (DARK_THEME_IDS.has(themeId)) return 'dark';
  if (
    (themeId === 'custom' || themeId === 'custom-theme') &&
    typeof customThemeIsDark === 'boolean'
  ) {
    return customThemeIsDark ? 'dark' : 'light';
  }
  return '';
}
