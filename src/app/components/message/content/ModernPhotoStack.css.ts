import { style } from '@vanilla-extract/css';
import { DefaultReset, config, toRem } from 'folds';

export const StackContainer = style([
  DefaultReset,
  {
    position: 'relative',
    width: toRem(280),
    height: toRem(310),
    margin: `${config.space.S200} 0`,
    userSelect: 'none',
    cursor: 'pointer',
    maxWidth: '100%',
    perspective: 1000,
  },
]);

export const StackContainerOwn = style({
  marginLeft: 'auto',
  alignSelf: 'flex-end',
});

export const PhotoCardBase = style([
  DefaultReset,
  {
    position: 'absolute',
    width: toRem(165),
    height: toRem(175),
    borderRadius: toRem(20),
    overflow: 'hidden',
    backgroundColor: 'var(--fc-surface-variant-container, #2e3238)',
    border: '2.5px solid rgba(255, 255, 255, 0.88)',
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.22), 0 3px 10px rgba(0, 0, 0, 0.1)',
    transition:
      'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 320ms ease, z-index 0s',
    cursor: 'pointer',
    willChange: 'transform',
    ':focus-visible': {
      outline: `${toRem(2)} solid var(--fc-primary-main, #007AFF)`,
    },
  },
]);

/* 3-card stack layout (matching reference image) */
export const CardTop = style({
  top: toRem(8),
  left: toRem(62),
  transform: 'rotate(4.5deg)',
  zIndex: 1,
  selectors: {
    [`${StackContainer}:hover &`]: {
      transform: 'rotate(7.5deg) translate(8px, -8px)',
    },
    '&:hover': {
      transform: 'scale(1.08) rotate(0deg) translate(0px, -6px) !important',
      zIndex: '10 !important',
      boxShadow: '0 20px 42px rgba(0, 0, 0, 0.35) !important',
    },
  },
});

export const CardMiddle = style({
  top: toRem(68),
  left: toRem(8),
  transform: 'rotate(-7.5deg)',
  zIndex: 2,
  selectors: {
    [`${StackContainer}:hover &`]: {
      transform: 'rotate(-11deg) translate(-10px, 4px)',
    },
    '&:hover': {
      transform: 'scale(1.08) rotate(0deg) translate(-4px, 0px) !important',
      zIndex: '10 !important',
      boxShadow: '0 20px 42px rgba(0, 0, 0, 0.35) !important',
    },
  },
});

export const CardBottom = style({
  top: toRem(132),
  left: toRem(52),
  transform: 'rotate(3deg)',
  zIndex: 3,
  selectors: {
    [`${StackContainer}:hover &`]: {
      transform: 'rotate(4.5deg) translate(6px, 12px)',
    },
    '&:hover': {
      transform: 'scale(1.08) rotate(0deg) translate(0px, 4px) !important',
      zIndex: '10 !important',
      boxShadow: '0 20px 42px rgba(0, 0, 0, 0.35) !important',
    },
  },
});

/* 2-card stack layout */
export const CardPairTop = style({
  top: toRem(14),
  left: toRem(45),
  transform: 'rotate(4.5deg)',
  zIndex: 1,
  selectors: {
    [`${StackContainer}:hover &`]: {
      transform: 'rotate(7deg) translate(6px, -6px)',
    },
    '&:hover': {
      transform: 'scale(1.08) rotate(0deg) !important',
      zIndex: '10 !important',
      boxShadow: '0 20px 42px rgba(0, 0, 0, 0.35) !important',
    },
  },
});

export const CardPairBottom = style({
  top: toRem(70),
  left: toRem(12),
  transform: 'rotate(-6deg)',
  zIndex: 2,
  selectors: {
    [`${StackContainer}:hover &`]: {
      transform: 'rotate(-9deg) translate(-6px, 6px)',
    },
    '&:hover': {
      transform: 'scale(1.08) rotate(0deg) !important',
      zIndex: '10 !important',
      boxShadow: '0 20px 42px rgba(0, 0, 0, 0.35) !important',
    },
  },
});

export const CardImage = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  pointerEvents: 'none',
});

export const CardOverlayBadge = style({
  position: 'absolute',
  bottom: toRem(8),
  right: toRem(8),
  backgroundColor: 'rgba(0, 0, 0, 0.68)',
  backdropFilter: 'blur(8px)',
  color: '#FFFFFF',
  padding: `${toRem(3)} ${toRem(8)}`,
  borderRadius: toRem(12),
  fontSize: toRem(12),
  fontWeight: 600,
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
  display: 'flex',
  alignItems: 'center',
  gap: toRem(4),
  pointerEvents: 'none',
});

export const ViewerNavButton = style({
  position: 'fixed',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 10001,
});

export const ViewerNavPrev = style({
  left: toRem(20),
});

export const ViewerNavNext = style({
  right: toRem(20),
});
