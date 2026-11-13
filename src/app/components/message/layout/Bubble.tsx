import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { Box, as } from 'folds';
import * as css from './layout.css';

export type BubbleLayoutProps = {
  hideBubble?: boolean;
  before?: ReactNode;
  header?: ReactNode;
  isOwn?: boolean;
  collapse?: boolean;
  time?: ReactNode;
};

export const BubbleLayout = as<'div', BubbleLayoutProps>(
  (
    {
      hideBubble,
      before,
      header,
      isOwn = false,
      collapse = false,
      time,
      children,
      className,
      ...props
    },
    ref
  ) => {
    if (hideBubble) {
      return (
        <Box gap="300" className={className} {...props} ref={ref}>
          <Box className={css.BubbleBefore} shrink="No">
            {before}
          </Box>
          <Box grow="Yes" direction="Column">
            {header}
            {children}
          </Box>
        </Box>
      );
    }

    if (isOwn) {
      return (
        <Box
          className={classNames(css.BubbleContainer, css.BubbleContainerOwn, className)}
          {...props}
          ref={ref}
        >
          <Box
            className={classNames(css.BubbleWrapper, css.BubbleWrapperOwn)}
            direction="Column"
            alignItems="End"
          >
            <Box
              className={classNames(
                css.BubbleContent,
                css.BubbleContentOwn,
                collapse && css.BubbleContentOwnCollapsed
              )}
              direction="Column"
            >
              {children}
              {time && <Box className={classNames(css.BubbleMeta, css.BubbleMetaOwn)}>{time}</Box>}
            </Box>
          </Box>
        </Box>
      );
    }

    return (
      <Box
        className={classNames(css.BubbleContainer, css.BubbleContainerIncoming, className)}
        gap="200"
        {...props}
        ref={ref}
      >
        <Box className={css.BubbleBefore} shrink="No">
          {before}
        </Box>
        <Box
          className={classNames(css.BubbleWrapper, css.BubbleWrapperIncoming)}
          direction="Column"
          alignItems="Start"
          grow="Yes"
        >
          {header}
          <Box
            className={classNames(
              css.BubbleContent,
              css.BubbleContentIncoming,
              collapse && css.BubbleContentIncomingCollapsed
            )}
            direction="Column"
          >
            {children}
            {time && (
              <Box className={classNames(css.BubbleMeta, css.BubbleMetaIncoming)}>{time}</Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  }
);
