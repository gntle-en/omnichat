import React, { useState } from 'react';
import { Menu, Modal, Overlay, OverlayBackdrop, OverlayCenter, PopOut, toRem } from 'folds';
import FocusTrap from 'focus-trap-react';
import { useCloseUserRoomProfile, useUserRoomProfileState } from '../state/hooks/userRoomProfile';
import { UserRoomProfile } from './user-profile';
import { UserRoomProfileState } from '../state/userRoomProfile';
import { useAllJoinedRoomsSet, useGetRoom } from '../hooks/useGetRoom';
import { stopPropagation } from '../utils/keyboard';
import { SpaceProvider } from '../hooks/useSpace';
import { RoomProvider } from '../hooks/useRoom';
import { TextViewer } from './text-viewer';

function UserRoomProfileContextMenu({
  state,
  onViewSource,
}: {
  state: UserRoomProfileState;
  onViewSource: (title: string, text: string) => void;
}) {
  const { roomId, spaceId, userId, cords, position } = state;
  const allJoinedRooms = useAllJoinedRoomsSet();
  const getRoom = useGetRoom(allJoinedRooms);
  const room = getRoom(roomId);
  const space = spaceId ? getRoom(spaceId) : undefined;

  const close = useCloseUserRoomProfile();

  if (!room) return null;

  return (
    <PopOut
      anchor={cords}
      position={position ?? 'Top'}
      align="Start"
      content={
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: close,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Menu style={{ width: toRem(340) }}>
            <SpaceProvider value={space ?? null}>
              <RoomProvider value={room}>
                <UserRoomProfile
                  userId={userId}
                  onViewSource={(title, text) => {
                    close();
                    onViewSource(title, text);
                  }}
                />
              </RoomProvider>
            </SpaceProvider>
          </Menu>
        </FocusTrap>
      }
    />
  );
}

export function UserRoomProfileRenderer() {
  const state = useUserRoomProfileState();
  const [viewSource, setViewSource] = useState<{ title: string; text: string }>();

  return (
    <>
      {state && (
        <UserRoomProfileContextMenu
          state={state}
          onViewSource={(title, text) => setViewSource({ title, text })}
        />
      )}
      <Overlay open={!!viewSource} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              onDeactivate: () => setViewSource(undefined),
              clickOutsideDeactivates: true,
              escapeDeactivates: stopPropagation,
            }}
          >
            <Modal variant="Surface" size="500">
              {viewSource && (
                <TextViewer
                  name={viewSource.title}
                  langName="json"
                  text={viewSource.text}
                  requestClose={() => setViewSource(undefined)}
                />
              )}
            </Modal>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
    </>
  );
}
