import React, { KeyboardEvent, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import {
  Box,
  Icon,
  IconButton,
  Icons,
  Modal,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  as,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { EncryptedAttachmentInfo } from 'browser-encrypt-attachment';

import * as css from './ModernPhotoStack.css';
import { ImageViewer } from '../../image-viewer';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { FALLBACK_MIMETYPE } from '../../../utils/mimeTypes';
import { decryptFile, downloadEncryptedMedia, mxcUrlToHttp } from '../../../utils/matrix';
import { ModalWide } from '../../../styles/Modal.css';
import { PhotoStackItem } from '../../../utils/photoCluster';

export type { PhotoStackItem };

export type ModernPhotoStackProps = {
  photos: PhotoStackItem[];
  isOwn?: boolean;
  className?: string;
};

function StackPhotoCard({
  photo,
  cardClass,
  badgeText,
  onClick,
}: {
  photo: PhotoStackItem;
  cardClass: string;
  badgeText?: string;
  onClick: () => void;
}) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();

  const [srcState, loadSrc] = useAsyncCallback(
    useCallback(async () => {
      const mediaUrl = mxcUrlToHttp(mx, photo.url, useAuthentication);
      if (!mediaUrl) throw new Error('Invalid media URL');
      if (photo.encInfo) {
        const fileContent = await downloadEncryptedMedia(mediaUrl, (encBuf) =>
          decryptFile(
            encBuf,
            photo.mimeType ?? FALLBACK_MIMETYPE,
            photo.encInfo as unknown as EncryptedAttachmentInfo
          )
        );
        return URL.createObjectURL(fileContent);
      }
      return mediaUrl;
    }, [mx, photo.url, useAuthentication, photo.mimeType, photo.encInfo])
  );

  useEffect(() => {
    loadSrc();
  }, [loadSrc]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const imgSrc = srcState.status === AsyncStatus.Success ? srcState.data : null;

  return (
    <div
      role="button"
      tabIndex={0}
      className={classNames(css.PhotoCardBase, cardClass)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={photo.body || 'Photo'}
    >
      {imgSrc ? (
        <img className={css.CardImage} src={imgSrc} alt={photo.body || 'Photo'} loading="lazy" />
      ) : (
        <Box
          alignItems="Center"
          justifyContent="Center"
          style={{ width: '100%', height: '100%', opacity: 0.5 }}
        >
          <Icon size="200" src={Icons.Photo} />
        </Box>
      )}

      {badgeText && (
        <div className={css.CardOverlayBadge}>
          <Icon size="50" src={Icons.Photo} />
          <span>{badgeText}</span>
        </div>
      )}
    </div>
  );
}

export const ModernPhotoStack = as<'div', ModernPhotoStackProps>(
  ({ photos, isOwn, className, ...props }, ref) => {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const mx = useMatrixClient();
    const useAuthentication = useMediaAuthentication();

    if (!photos || photos.length === 0) return null;

    const count = photos.length;
    const isPair = count === 2;

    const currentViewerPhoto = viewerIndex !== null ? photos[viewerIndex] : null;

    const [viewerSrcState, loadViewerSrc] = useAsyncCallback(
      useCallback(async () => {
        if (!currentViewerPhoto) return '';
        const mediaUrl = mxcUrlToHttp(mx, currentViewerPhoto.url, useAuthentication);
        if (!mediaUrl) throw new Error('Invalid media URL');
        if (currentViewerPhoto.encInfo) {
          const fileContent = await downloadEncryptedMedia(mediaUrl, (encBuf) =>
            decryptFile(
              encBuf,
              currentViewerPhoto.mimeType ?? FALLBACK_MIMETYPE,
              currentViewerPhoto.encInfo as unknown as EncryptedAttachmentInfo
            )
          );
          return URL.createObjectURL(fileContent);
        }
        return mediaUrl;
      }, [mx, currentViewerPhoto, useAuthentication])
    );

    useEffect(() => {
      if (viewerIndex !== null) {
        loadViewerSrc();
      }
    }, [viewerIndex, loadViewerSrc]);

    const handlePrev = useCallback(() => {
      setViewerIndex((curr) => {
        if (curr === null) return 0;
        return curr > 0 ? curr - 1 : count - 1;
      });
    }, [count]);

    const handleNext = useCallback(() => {
      setViewerIndex((curr) => {
        if (curr === null) return 0;
        return curr < count - 1 ? curr + 1 : 0;
      });
    }, [count]);

    useEffect(() => {
      if (viewerIndex === null) return undefined;
      const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'Escape') {
          setViewerIndex(null);
        }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [viewerIndex, handlePrev, handleNext]);

    const viewerSrc = viewerSrcState.status === AsyncStatus.Success ? viewerSrcState.data : '';

    return (
      <>
        <div
          ref={ref}
          className={classNames(css.StackContainer, isOwn && css.StackContainerOwn, className)}
          {...props}
        >
          {isPair ? (
            <>
              <StackPhotoCard
                photo={photos[0]}
                cardClass={css.CardPairTop}
                onClick={() => setViewerIndex(0)}
              />
              <StackPhotoCard
                photo={photos[1]}
                cardClass={css.CardPairBottom}
                onClick={() => setViewerIndex(1)}
              />
            </>
          ) : (
            <>
              {/* Top / Back Card */}
              <StackPhotoCard
                photo={photos[0]}
                cardClass={css.CardTop}
                onClick={() => setViewerIndex(0)}
              />
              {/* Middle / Left Card */}
              <StackPhotoCard
                photo={photos[1]}
                cardClass={css.CardMiddle}
                onClick={() => setViewerIndex(1)}
              />
              {/* Bottom / Front Card (matching reference fan) */}
              <StackPhotoCard
                photo={photos[2]}
                cardClass={css.CardBottom}
                badgeText={count > 3 ? `+${count - 2}` : undefined}
                onClick={() => setViewerIndex(2)}
              />
            </>
          )}
        </div>

        {/* Lightbox Gallery Viewer with Navigation */}
        <Overlay open={viewerIndex !== null} backdrop={<OverlayBackdrop />}>
          <OverlayCenter>
            <FocusTrap
              focusTrapOptions={{
                initialFocus: false,
                onDeactivate: () => setViewerIndex(null),
                clickOutsideDeactivates: true,
              }}
            >
              <Modal className={ModalWide} variant="Surface" size="500">
                {currentViewerPhoto && (
                  <ImageViewer
                    alt={`${currentViewerPhoto.body || 'Photo'} (${
                      (viewerIndex ?? 0) + 1
                    }/${count})`}
                    src={viewerSrc}
                    requestClose={() => setViewerIndex(null)}
                  />
                )}
              </Modal>
            </FocusTrap>
          </OverlayCenter>

          {count > 1 && viewerIndex !== null && (
            <>
              <div className={classNames(css.ViewerNavButton, css.ViewerNavPrev)}>
                <IconButton
                  variant="Surface"
                  radii="Pill"
                  size="400"
                  aria-label="Previous photo"
                  onClick={handlePrev}
                >
                  <Icon size="100" src={Icons.ChevronLeft} />
                </IconButton>
              </div>

              <div className={classNames(css.ViewerNavButton, css.ViewerNavNext)}>
                <IconButton
                  variant="Surface"
                  radii="Pill"
                  size="400"
                  aria-label="Next photo"
                  onClick={handleNext}
                >
                  <Icon size="100" src={Icons.ChevronRight} />
                </IconButton>
              </div>
            </>
          )}
        </Overlay>
      </>
    );
  }
);
