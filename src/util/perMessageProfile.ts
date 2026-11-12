export interface PerMessageProfile {
  displayname?: string;
  avatarUrl?: string;
}

const PER_MESSAGE_PROFILE_KEY = 'com.beeper.per_message_profile';

/** Extract MSC4144 / Beeper per-message profile overrides from a Matrix event content object. */
export function getPerMessageProfile(content: unknown): PerMessageProfile | undefined {
  if (typeof content !== 'object' || content === null) return undefined;
  const rawProfile = (content as Record<string, unknown>)[PER_MESSAGE_PROFILE_KEY];
  if (typeof rawProfile !== 'object' || rawProfile === null) return undefined;

  const record = rawProfile as Record<string, unknown>;
  const displayname =
    typeof record.displayname === 'string' && record.displayname.trim() !== ''
      ? record.displayname
      : undefined;
  const avatarUrl =
    typeof record.avatar_url === 'string' && record.avatar_url.startsWith('mxc://')
      ? record.avatar_url
      : undefined;

  if (!displayname && !avatarUrl) return undefined;
  return { displayname, avatarUrl };
}

/** Check whether two events share the same effective sender identity, accounting for bridge per-message profiles. */
export function hasSameEffectiveSender(
  prevSender: string | undefined,
  prevContent: unknown,
  nextSender: string | undefined,
  nextContent: unknown
): boolean {
  if (!prevSender || prevSender !== nextSender) return false;

  const prevProfile = getPerMessageProfile(prevContent);
  const nextProfile = getPerMessageProfile(nextContent);
  if (!prevProfile && !nextProfile) return true;

  return (
    prevProfile?.displayname === nextProfile?.displayname &&
    prevProfile?.avatarUrl === nextProfile?.avatarUrl
  );
}

