import React, { useCallback, useEffect, useState } from 'react';
import { IPreviewUrlResponse } from 'matrix-js-sdk';
import { Box, Icon, IconButton, Icons, Text, as, color, config, toRem } from 'folds';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { mxcUrlToHttp } from '../../utils/matrix';
import { ParsedYouTubeVideo } from '../../utils/youtube';
import * as css from './UrlPreview.css';

export const YouTubeEmbedCard = as<'div', { url: string; ts: number; parsed: ParsedYouTubeVideo }>(
  ({ url, ts, parsed, ...props }, ref) => {
    const mx = useMatrixClient();
    const useAuthentication = useMediaAuthentication();
    const [playing, setPlaying] = useState(false);
    const [thumbError, setThumbError] = useState(false);

    const [previewStatus, loadPreview] = useAsyncCallback(
      useCallback(() => mx.getUrlPreview(url, ts), [url, ts, mx])
    );

    useEffect(() => {
      setPlaying(false);
      setThumbError(false);
      loadPreview();
    }, [loadPreview, url]);

    const previewData: IPreviewUrlResponse | undefined =
      previewStatus.status === AsyncStatus.Success ? previewStatus.data : undefined;
    const rawTitle = previewData?.['og:title'];
    const title = typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle : url;
    const ogImageMxc = previewData?.['og:image'];
    const thumbUrl = ogImageMxc
      ? mxcUrlToHttp(mx, ogImageMxc, useAuthentication, 480, 270, 'scale', false)
      : null;

    return (
      <Box
        shrink="No"
        direction="Column"
        className={css.UrlPreview}
        style={{ minHeight: 'unset', width: toRem(400), maxWidth: '100%' }}
        {...props}
        ref={ref}
      >
        <Box
          alignItems="Center"
          justifyContent="SpaceBetween"
          gap="200"
          style={{
            padding: `${config.space.S100} ${config.space.S200}`,
            borderBottom: `${config.borderWidth.B300} solid ${color.SurfaceVariant.ContainerLine}`,
          }}
        >
          <Text size="T200" truncate>
            {`YouTube — ${title}`}
          </Text>
          <IconButton
            type="button"
            variant="SurfaceVariant"
            fill="None"
            size="300"
            radii="Pill"
            aria-label="Open video in new tab"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          >
            <Icon size="100" src={Icons.External} />
          </IconButton>
        </Box>

        <Box
          alignItems="Center"
          justifyContent="Center"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            backgroundColor: '#000',
            overflow: 'hidden',
          }}
        >
          {playing ? (
            <iframe
              src={parsed.embedUrl}
              title={`YouTube player: ${title}`}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
            />
          ) : (
            <>
              {thumbUrl && !thumbError && (
                <img
                  src={thumbUrl}
                  alt={title}
                  onError={() => setThumbError(true)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}
              <IconButton
                type="button"
                variant="Primary"
                fill="Solid"
                radii="Pill"
                size="400"
                aria-label="Play YouTube video"
                onClick={() => setPlaying(true)}
                style={{ position: 'relative', zIndex: 1 }}
              >
                <Icon size="300" src={Icons.Play} filled />
              </IconButton>
            </>
          )}
        </Box>
      </Box>
    );
  }
);

