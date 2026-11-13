import { createVar, globalStyle, keyframes, style, styleVariants } from '@vanilla-extract/css';
import { recipe, RecipeVariants } from '@vanilla-extract/recipes';
import { DefaultReset, color, config, toRem } from 'folds';

export const StickySection = style({
  position: 'sticky',
  top: config.space.S100,
});

const SpacingVar = createVar();
const SpacingVariant = styleVariants({
  '0': {
    vars: {
      [SpacingVar]: config.space.S0,
    },
  },
  '100': {
    vars: {
      [SpacingVar]: config.space.S100,
    },
  },
  '200': {
    vars: {
      [SpacingVar]: config.space.S200,
    },
  },
  '300': {
    vars: {
      [SpacingVar]: config.space.S300,
    },
  },
  '400': {
    vars: {
      [SpacingVar]: config.space.S400,
    },
  },
  '500': {
    vars: {
      [SpacingVar]: config.space.S500,
    },
  },
});

const highlightAnime = keyframes({
  '0%': {
    backgroundColor: color.Primary.Container,
  },
  '25%': {
    backgroundColor: color.Primary.ContainerActive,
  },
  '50%': {
    backgroundColor: color.Primary.Container,
  },
  '75%': {
    backgroundColor: color.Primary.ContainerActive,
  },
  '100%': {
    backgroundColor: color.Primary.Container,
  },
});
const HighlightVariant = styleVariants({
  true: {
    animation: `${highlightAnime} 2000ms ease-in-out`,
    animationIterationCount: 'infinite',
  },
});

const SelectedVariant = styleVariants({
  true: {
    backgroundColor: color.Surface.ContainerActive,
  },
});

const AutoCollapse = style({
  selectors: {
    [`&+&`]: {
      marginTop: 0,
    },
  },
});

export const MessageBase = recipe({
  base: [
    DefaultReset,
    {
      marginTop: SpacingVar,
      padding: `${config.space.S100} ${config.space.S200} ${config.space.S100} ${config.space.S400}`,
      borderRadius: `0 ${config.radii.R400} ${config.radii.R400} 0`,
    },
  ],
  variants: {
    space: SpacingVariant,
    collapse: {
      true: {
        marginTop: 0,
      },
    },
    autoCollapse: {
      true: AutoCollapse,
    },
    highlight: HighlightVariant,
    selected: SelectedVariant,
  },
  defaultVariants: {
    space: '400',
  },
});

export type MessageBaseVariants = RecipeVariants<typeof MessageBase>;

export const CompactHeader = style([
  DefaultReset,
  StickySection,
  {
    maxWidth: toRem(170),
    width: '100%',
  },
]);

export const AvatarBase = style({
  paddingTop: toRem(4),
  transition: 'transform 200ms cubic-bezier(0, 0.8, 0.67, 0.97)',
  display: 'flex',
  alignSelf: 'start',

  selectors: {
    '&:hover': {
      transform: `translateY(${toRem(-2)})`,
    },
  },
});

export const ModernBefore = style({
  minWidth: toRem(36),
});

export const BubbleBefore = style({
  minWidth: toRem(36),
});

export const BubbleContainer = style({
  width: '100%',
  display: 'flex',
  position: 'relative',
});

export const BubbleContainerOwn = style({
  justifyContent: 'flex-end',
});

export const BubbleContainerIncoming = style({
  justifyContent: 'flex-start',
});

export const BubbleWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 'min(78%, 620px)',
  width: 'fit-content',
});

export const BubbleWrapperOwn = style({
  alignItems: 'flex-end',
  marginLeft: 'auto',
});

export const BubbleWrapperIncoming = style({
  alignItems: 'flex-start',
  marginRight: 'auto',
});

export const BubbleContent = style({
  maxWidth: '100%',
  width: 'fit-content',
  padding: `${toRem(8)} ${toRem(14)}`,
  backgroundColor: 'var(--omni-bubble-incoming-bg, var(--fc-surface-variant-container, #2e3238))',
  color: 'var(--omni-bubble-incoming-color, var(--fc-surface-variant-on-container, #FFFFFF))',
  borderRadius: 'var(--omni-bubble-radius, 18px)',
  position: 'relative',
  wordBreak: 'break-word',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
  transition: 'background-color 150ms ease, border-radius 150ms ease',
});

export const BubbleContentOwn = style({
  backgroundColor: 'var(--omni-bubble-outgoing-bg, #007AFF)',
  color: 'var(--omni-bubble-outgoing-color, #FFFFFF)',
  borderBottomRightRadius: 'var(--omni-bubble-tail-radius, 4px)',
  marginLeft: 'auto',
  alignSelf: 'flex-end',
});

export const BubbleContentOwnCollapsed = style({
  borderTopRightRadius: 'var(--omni-bubble-tail-radius, 4px)',
});

export const BubbleContentIncoming = style({
  backgroundColor: 'var(--omni-bubble-incoming-bg, var(--fc-surface-variant-container, #2e3238))',
  color: 'var(--omni-bubble-incoming-color, var(--fc-surface-variant-on-container, #FFFFFF))',
  borderBottomLeftRadius: 'var(--omni-bubble-tail-radius, 4px)',
  marginRight: 'auto',
  alignSelf: 'flex-start',
});

export const BubbleContentIncomingCollapsed = style({
  borderTopLeftRadius: 'var(--omni-bubble-tail-radius, 4px)',
});

export const BubbleMeta = style({
  display: 'flex',
  alignItems: 'center',
  paddingTop: toRem(2),
  opacity: 0.72,
  userSelect: 'none',
});

export const BubbleMetaOwn = style({
  justifyContent: 'flex-end',
  color: 'inherit',
});

export const BubbleMetaIncoming = style({
  justifyContent: 'flex-start',
});

globalStyle(
  `${BubbleContentOwn} p, ${BubbleContentOwn} span:not([data-emoji]), ${BubbleContentOwn} div`,
  {
    color: 'inherit',
  }
);

globalStyle(
  `${BubbleContentIncoming} p, ${BubbleContentIncoming} span:not([data-emoji]), ${BubbleContentIncoming} div`,
  {
    color: 'inherit',
  }
);

globalStyle(`${BubbleContentOwn} a`, {
  color: 'var(--omni-bubble-outgoing-link, #CBE5FF)',
  textDecoration: 'underline',
});

globalStyle(`${BubbleContentIncoming} a`, {
  color: 'var(--omni-bubble-incoming-link, var(--tc-link, #5e9eff))',
  textDecoration: 'underline',
});

globalStyle(`${BubbleContentOwn} code`, {
  backgroundColor: 'rgba(255, 255, 255, 0.22)',
  color: 'inherit',
  borderRadius: toRem(4),
  padding: `${toRem(1)} ${toRem(4)}`,
});

globalStyle(`${BubbleContentOwn} pre`, {
  backgroundColor: 'rgba(0, 0, 0, 0.28)',
  color: 'inherit',
  borderRadius: toRem(8),
});

export const BubbleContentArrowLeft = style({
  borderTopLeftRadius: 0,
});

export const BubbleLeftArrow = style({
  width: toRem(9),
  height: toRem(8),

  position: 'absolute',
  top: 0,
  left: toRem(-8),
  zIndex: 1,
});

export const Username = style({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  selectors: {
    'button&': {
      cursor: 'pointer',
    },
    'button&:hover, button&:focus-visible': {
      textDecoration: 'underline',
    },
  },
});

export const UsernameBold = style({
  fontWeight: 550,
});

export const MessageTextBody = recipe({
  base: {
    wordBreak: 'break-word',
  },
  variants: {
    preWrap: {
      true: {
        whiteSpace: 'pre-wrap',
      },
    },
    jumboEmoji: {
      true: {
        fontSize: '1.504em',
        lineHeight: '1.4962em',
      },
    },
    emote: {
      true: {
        color: color.Success.Main,
        fontStyle: 'italic',
      },
    },
  },
});

export type MessageTextBodyVariants = RecipeVariants<typeof MessageTextBody>;
