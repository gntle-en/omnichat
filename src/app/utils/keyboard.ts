import { isKeyHotkey } from 'is-hotkey';
import { KeyboardEventHandler, useEffect } from 'react';
import { getNextRoomNavIndex, getSpaceHotkeyIndex } from '../../util/hotkeys';

export interface KeyboardEventLike {
  key: string;
  which: number;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  preventDefault(): void;
}

export const onTabPress = (evt: KeyboardEventLike, callback: () => void) => {
  if (isKeyHotkey('tab', evt)) {
    evt.preventDefault();
    callback();
  }
};

export const preventScrollWithArrowKey: KeyboardEventHandler = (evt) => {
  if (isKeyHotkey(['arrowup', 'arrowright', 'arrowdown', 'arrowleft'], evt)) {
    evt.preventDefault();
  }
};

export const onEnterOrSpace =
  <T>(callback: (evt: T) => void) =>
  (evt: KeyboardEventLike) => {
    if (isKeyHotkey('enter', evt) || isKeyHotkey('space', evt)) {
      evt.preventDefault();
      callback(evt as T);
    }
  };

export const stopPropagation = (evt: KeyboardEvent): boolean => {
  const ae = document.activeElement;
  const editableActiveElement = ae
    ? ae.nodeName.toLowerCase() === 'input' ||
      ae.nodeName.toLowerCase() === 'textarea' ||
      ae.getAttribute('contenteditable') === 'true'
    : false;

  if (editableActiveElement) return false;

  evt.stopPropagation();
  return true;
};

export const useClientNavigationHotkeys = () => {
  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      if (evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
        if (evt.key !== 'ArrowUp' && evt.key !== 'ArrowDown') return;

        const roomItems = Array.from(
          document.querySelectorAll<HTMLElement>('[data-room-nav-item]')
        );
        const selectedIdx = roomItems.findIndex(
          (item) => item.getAttribute('aria-selected') === 'true'
        );
        const nextIdx = getNextRoomNavIndex(
          selectedIdx,
          roomItems.length,
          evt.key === 'ArrowUp' ? 'up' : 'down'
        );
        if (nextIdx === null) return;

        const targetItem = roomItems[nextIdx];
        const link = targetItem.querySelector<HTMLElement>('[data-room-nav-link]');
        if (!link) return;

        evt.preventDefault();
        link.click();
        targetItem.scrollIntoView({ block: 'nearest' });
        return;
      }

      if (evt.ctrlKey && !evt.altKey && !evt.metaKey && !evt.shiftKey) {
        const spaceTabs = Array.from(document.querySelectorAll<HTMLElement>('[data-space-tab]'));
        const spaceIdx = getSpaceHotkeyIndex(evt.key, spaceTabs.length);
        if (spaceIdx === null) return;

        evt.preventDefault();
        const targetTab = spaceTabs[spaceIdx];
        targetTab.click();
        targetTab.scrollIntoView({ block: 'nearest' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
};
