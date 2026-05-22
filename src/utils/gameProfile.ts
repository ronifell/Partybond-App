import type { User } from '../api/types';

/** True when the user has nickname + player ID saved for this game. */
export function hasGameProfileForGame(
  user: Pick<User, 'gameProfiles'> | null | undefined,
  gameId: string,
): boolean {
  const profile = (user?.gameProfiles ?? []).find((p) => p.gameId === gameId);
  if (!profile) return false;
  return profile.nickname.trim().length > 0 && profile.playerId.trim().length > 0;
}
