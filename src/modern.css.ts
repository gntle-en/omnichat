import { globalStyle, style } from '@vanilla-extract/css';
import { FocusOutline, RadiiVariant, color, config } from 'folds';
import { UserAvatar } from './app/components/user-avatar/UserAvatar.css';
import { RoomAvatar } from './app/components/room-avatar/RoomAvatar.css';
import { AvatarPlaceholder } from './app/features/lobby/style.css';

const MODERN_ROOT = ":root[data-ui-style='modern']";

/**
 * Internal folds@2.7.2 component base selectors for UI controls that expose no
 * dedicated CSS class variable in the public package exports.
 * Asserted in tests/uiStyle.test.ts against node_modules/folds/dist/style.css.
 */
const FOLDS_CLASSES = {
  button: '.epr39zd',
  iconButton: '.brs7ce5',
  chip: '._1bv8u1w6',
  badge: '._13qe89m6',
  modal: '._1fc5sz51',
  overlayBackdrop: '._1oc5jl82',
  switchThumb: '._1gp7uix9',
  switchTrack: '._1gp7uix2',
} as const;

const MODERN_TRANSITION =
  'background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), ' +
  'border-color 150ms cubic-bezier(0.22, 1, 0.36, 1), ' +
  'box-shadow 150ms cubic-bezier(0.22, 1, 0.36, 1), ' +
  'color 150ms cubic-bezier(0.22, 1, 0.36, 1)';

/** Applied directly to placeholder avatars that do not wrap UserAvatar/RoomAvatar. */
export const ModernRoundAvatar = style({
  selectors: {
    [`${MODERN_ROOT} &`]: {
      borderRadius: config.radii.Round,
    },
  },
});

/* Circular 50% avatars across user profiles, messages, rooms, spaces, and placeholders */
globalStyle(
  [
    `${MODERN_ROOT} *:has(> .${UserAvatar})`,
    `${MODERN_ROOT} *:has(> .${RoomAvatar})`,
    `${MODERN_ROOT} .${AvatarPlaceholder}`,
  ].join(', '),
  {
    borderRadius: config.radii.Round,
  }
);

/* Pill controls: buttons, icon buttons, chips, and notification badges (unless radii="0") */
globalStyle(
  [
    `${MODERN_ROOT} ${FOLDS_CLASSES.button}:not(.${RadiiVariant['0']})`,
    `${MODERN_ROOT} ${FOLDS_CLASSES.iconButton}:not(.${RadiiVariant['0']})`,
    `${MODERN_ROOT} ${FOLDS_CLASSES.chip}:not(.${RadiiVariant['0']})`,
    `${MODERN_ROOT} ${FOLDS_CLASSES.badge}:not(.${RadiiVariant['0']})`,
  ].join(', '),
  {
    borderRadius: config.radii.Pill,
  }
);

/* Modal rounded surface (16px) and subtle backdrop blur */
globalStyle(`${MODERN_ROOT} ${FOLDS_CLASSES.modal}`, {
  borderRadius: config.radii.R500,
});

globalStyle(`${MODERN_ROOT} ${FOLDS_CLASSES.overlayBackdrop}`, {
  backdropFilter: 'blur(6px)',
});

/* Smooth interactive color and switch thumb transitions */
globalStyle(
  [
    `${MODERN_ROOT} button`,
    `${MODERN_ROOT} input`,
    `${MODERN_ROOT} textarea`,
    `${MODERN_ROOT} select`,
    `${MODERN_ROOT} [role="button"]`,
    `${MODERN_ROOT} [role="switch"]`,
  ].join(', '),
  {
    transition: MODERN_TRANSITION,
  }
);

globalStyle(`${MODERN_ROOT} ${FOLDS_CLASSES.switchTrack} ${FOLDS_CLASSES.switchThumb}`, {
  transition: 'transform 160ms cubic-bezier(0.22, 1, 0.36, 1), background-color 150ms ease',
});

/* Visible keyboard focus ring */
globalStyle(
  [
    `${MODERN_ROOT} .${FocusOutline}:focus-visible`,
    `${MODERN_ROOT} button:focus-visible`,
    `${MODERN_ROOT} [role="button"]:focus-visible`,
    `${MODERN_ROOT} a:focus-visible`,
    `${MODERN_ROOT} input:focus-visible`,
    `${MODERN_ROOT} textarea:focus-visible`,
    `${MODERN_ROOT} select:focus-visible`,
  ].join(', '),
  {
    outline: `2px solid var(--tc-link, ${color.Other.FocusRing})`,
    outlineOffset: '2px',
  }
);

/* Respect prefers-reduced-motion */
globalStyle(`${MODERN_ROOT} ${FOLDS_CLASSES.switchTrack} ${FOLDS_CLASSES.switchThumb}`, {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'background-color 150ms ease',
    },
  },
});

globalStyle(
  [
    `${MODERN_ROOT} button`,
    `${MODERN_ROOT} input`,
    `${MODERN_ROOT} textarea`,
    `${MODERN_ROOT} select`,
    `${MODERN_ROOT} [role="button"]`,
    `${MODERN_ROOT} [role="switch"]`,
  ].join(', '),
  {
    '@media': {
      '(prefers-reduced-motion: reduce)': {
        transition: 'none',
        transform: 'none',
      },
    },
  }
);
