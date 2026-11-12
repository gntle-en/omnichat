export function getNextRoomNavIndex(
  selectedIndex: number,
  total: number,
  direction: 'up' | 'down'
): number | null {
  if (total <= 0) return null;
  if (selectedIndex < 0) {
    return direction === 'down' ? 0 : total - 1;
  }
  const next = selectedIndex + (direction === 'up' ? -1 : 1);
  return next >= 0 && next < total ? next : null;
}

export function getSpaceHotkeyIndex(key: string, totalSpaces: number): number | null {
  if (totalSpaces <= 0) return null;
  if (!/^[1-9]$/.test(key)) return null;
  const idx = Number(key) - 1;
  return idx < totalSpaces ? idx : null;
}

