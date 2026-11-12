export type UiStyle = 'modern' | 'classic';

export const DEFAULT_UI_STYLE: UiStyle = 'modern';

export function parseUiStyle(value: unknown): UiStyle {
  return value === 'classic' || value === 'modern' ? value : DEFAULT_UI_STYLE;
}

export function applyUiStyleToElement(
  element: Pick<HTMLElement, 'setAttribute'>,
  uiStyle: UiStyle,
): void {
  element.setAttribute('data-ui-style', parseUiStyle(uiStyle));
}

export function getColorSchemeForTheme(themeId: string): 'light' | 'dark' | '' {
  if (themeId === 'light' || themeId === 'silver') return 'light';
  if (themeId === 'ayu' || themeId === 'classic' || themeId === 'butter') return 'dark';
  return '';
}
