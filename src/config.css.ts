import { createTheme } from '@vanilla-extract/css';
import { config } from 'folds';

export const onLightFontWeight = createTheme(config.fontWeight, {
  W100: '100',
  W200: '200',
  W300: '300',
  W400: '400',
  W500: '500',
  W600: '600',
  W700: '700',
  W800: '800',
  W900: '900',
});

export const onDarkFontWeight = createTheme(config.fontWeight, {
  W100: '100',
  W200: '200',
  W300: '300',
  W400: '400',
  W500: '500',
  W600: '600',
  W700: '700',
  W800: '800',
  W900: '900',
});

export const atkinsonFontTheme = createTheme(config.font, {
  Inter: "'Atkinson Hyperlegible', var(--font-emoji), sans-serif",
});

export const modernRadiiTheme = createTheme(config.radii, {
  R0: '0',
  R300: '0.375rem',
  R400: '0.75rem',
  R500: '1rem',
  Round: '50%',
  Pill: '9999px',
});

export const modernShadowTheme = createTheme(config.shadow, {
  E100: '0 1px 2px rgba(0, 0, 0, 0.08), 0 4px 14px rgba(0, 0, 0, 0.06)',
  E200: '0 4px 12px rgba(0, 0, 0, 0.14), 0 12px 28px rgba(0, 0, 0, 0.14)',
  E300: '0 4px 12px rgba(0, 0, 0, 0.14), 0 16px 36px rgba(0, 0, 0, 0.18)',
  E400: '0 8px 24px rgba(0, 0, 0, 0.18), 0 24px 48px rgba(0, 0, 0, 0.22)',
});
