export type UiStyle = 'modern' | 'classic' | 'custom';
export type UiFont = 'atkinson' | 'inter';

export type AvatarShape = 'circle' | 'squircle' | 'rounded' | 'square';
export type BubbleRadius = 'pill' | 'rounded' | 'subtle' | 'sharp';
export type BubbleAlignment = 'split' | 'left';
export type OutgoingBubbleColor = 'ios-blue' | 'accent' | 'surface';
export type ButtonShape = 'pill' | 'rounded' | 'sharp';

export interface CustomUiSettings {
  avatarShape: AvatarShape;
  bubbleRadius: BubbleRadius;
  bubbleAlignment: BubbleAlignment;
  bubbleTail: boolean;
  outgoingColor: OutgoingBubbleColor;
  backdropBlur: boolean;
  buttonShape: ButtonShape;
}

export const DEFAULT_UI_STYLE: UiStyle = 'modern';
export const DEFAULT_UI_FONT: UiFont = 'atkinson';

export const DEFAULT_CUSTOM_UI: CustomUiSettings = {
  avatarShape: 'circle',
  bubbleRadius: 'pill',
  bubbleAlignment: 'split',
  bubbleTail: true,
  outgoingColor: 'ios-blue',
  backdropBlur: true,
  buttonShape: 'pill',
};

const VALID_AVATAR_SHAPES = new Set<AvatarShape>(['circle', 'squircle', 'rounded', 'square']);
const VALID_BUBBLE_RADII = new Set<BubbleRadius>(['pill', 'rounded', 'subtle', 'sharp']);
const VALID_BUBBLE_ALIGNMENTS = new Set<BubbleAlignment>(['split', 'left']);
const VALID_OUTGOING_COLORS = new Set<OutgoingBubbleColor>(['ios-blue', 'accent', 'surface']);
const VALID_BUTTON_SHAPES = new Set<ButtonShape>(['pill', 'rounded', 'sharp']);

/** Normalize a persisted UI style value to a supported UiStyle. */
export function parseUiStyle(value: unknown): UiStyle {
  return value === 'classic' || value === 'modern' || value === 'custom' ? value : DEFAULT_UI_STYLE;
}

/** Normalize a persisted UI font value to a supported UiFont. */
export function parseUiFont(value: unknown): UiFont {
  return value === 'inter' || value === 'atkinson' ? value : DEFAULT_UI_FONT;
}

/** Normalize partial/persisted custom UI settings. */
export function parseCustomUiSettings(raw: unknown): CustomUiSettings {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_CUSTOM_UI };
  const r = raw as Record<string, unknown>;
  return {
    avatarShape: VALID_AVATAR_SHAPES.has(r.avatarShape as AvatarShape)
      ? (r.avatarShape as AvatarShape)
      : DEFAULT_CUSTOM_UI.avatarShape,
    bubbleRadius: VALID_BUBBLE_RADII.has(r.bubbleRadius as BubbleRadius)
      ? (r.bubbleRadius as BubbleRadius)
      : DEFAULT_CUSTOM_UI.bubbleRadius,
    bubbleAlignment: VALID_BUBBLE_ALIGNMENTS.has(r.bubbleAlignment as BubbleAlignment)
      ? (r.bubbleAlignment as BubbleAlignment)
      : DEFAULT_CUSTOM_UI.bubbleAlignment,
    bubbleTail: typeof r.bubbleTail === 'boolean' ? r.bubbleTail : DEFAULT_CUSTOM_UI.bubbleTail,
    outgoingColor: VALID_OUTGOING_COLORS.has(r.outgoingColor as OutgoingBubbleColor)
      ? (r.outgoingColor as OutgoingBubbleColor)
      : DEFAULT_CUSTOM_UI.outgoingColor,
    backdropBlur:
      typeof r.backdropBlur === 'boolean' ? r.backdropBlur : DEFAULT_CUSTOM_UI.backdropBlur,
    buttonShape: VALID_BUTTON_SHAPES.has(r.buttonShape as ButtonShape)
      ? (r.buttonShape as ButtonShape)
      : DEFAULT_CUSTOM_UI.buttonShape,
  };
}

export function getAvatarRadiusCss(shape: AvatarShape): string {
  switch (shape) {
    case 'circle':
      return '50%';
    case 'squircle':
      return '28%';
    case 'rounded':
      return '16%';
    case 'square':
      return '0px';
    default:
      return '50%';
  }
}

export function getBubbleRadiusCss(radius: BubbleRadius): string {
  switch (radius) {
    case 'pill':
      return '18px';
    case 'rounded':
      return '12px';
    case 'subtle':
      return '6px';
    case 'sharp':
      return '0px';
    default:
      return '18px';
  }
}

export function getButtonRadiusCss(shape: ButtonShape): string {
  switch (shape) {
    case 'pill':
      return '9999px';
    case 'rounded':
      return '8px';
    case 'sharp':
      return '0px';
    default:
      return '9999px';
  }
}

export interface StyleSettable {
  style: {
    setProperty: (name: string, value: string) => void;
    removeProperty: (name: string) => void;
  };
}

/** Set the root data-ui-style attribute to toggle Modern vs Classic vs Custom rules. */
export function applyUiStyleToElement(
  element: Pick<HTMLElement, 'setAttribute'>,
  uiStyle: UiStyle
): void {
  element.setAttribute('data-ui-style', parseUiStyle(uiStyle));
}

/** Apply granular custom UI variables (avatar shape, bubble radii, colors, blur, etc.). */
export function applyCustomUiSettingsToElement(
  element: StyleSettable,
  settings: CustomUiSettings
): void {
  element.style.setProperty('--omni-avatar-radius', getAvatarRadiusCss(settings.avatarShape));
  const bRadius = getBubbleRadiusCss(settings.bubbleRadius);
  element.style.setProperty('--omni-bubble-radius', bRadius);
  element.style.setProperty('--omni-bubble-tail-radius', settings.bubbleTail ? '4px' : bRadius);
  element.style.setProperty('--omni-bubble-alignment', settings.bubbleAlignment);
  if (settings.outgoingColor === 'ios-blue') {
    element.style.setProperty('--omni-bubble-outgoing-bg', '#007AFF');
    element.style.setProperty('--omni-bubble-outgoing-color', '#FFFFFF');
  } else if (settings.outgoingColor === 'accent') {
    element.style.setProperty('--omni-bubble-outgoing-bg', 'var(--fc-primary-main, #2a62a6)');
    element.style.setProperty('--omni-bubble-outgoing-color', 'var(--fc-primary-on-main, #FFFFFF)');
  } else {
    element.style.setProperty(
      '--omni-bubble-outgoing-bg',
      'var(--fc-surface-variant-container, #2e3238)'
    );
    element.style.setProperty(
      '--omni-bubble-outgoing-color',
      'var(--fc-surface-variant-on-container, #FFFFFF)'
    );
  }
  element.style.setProperty('--omni-backdrop-blur', settings.backdropBlur ? 'blur(6px)' : 'none');
  element.style.setProperty('--omni-button-radius', getButtonRadiusCss(settings.buttonShape));
}

export function clearCustomUiSettingsFromElement(element: StyleSettable): void {
  element.style.removeProperty('--omni-avatar-radius');
  element.style.removeProperty('--omni-bubble-radius');
  element.style.removeProperty('--omni-bubble-tail-radius');
  element.style.removeProperty('--omni-bubble-alignment');
  element.style.removeProperty('--omni-bubble-outgoing-bg');
  element.style.removeProperty('--omni-bubble-outgoing-color');
  element.style.removeProperty('--omni-backdrop-blur');
  element.style.removeProperty('--omni-button-radius');
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
