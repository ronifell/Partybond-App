import { type User, LOOKING_FOR_MAX_LENGTH } from './types';

export type ApiUserPayload = User & {
  looking_for?: string | null;
  premium_until?: string | null;
  is_premium?: boolean;
};

/**
 * Ensures `lookingFor` / premium fields are populated from API payloads (camelCase or snake_case).
 */
export function normalizeUser(raw: ApiUserPayload): User {
  const lf = raw.lookingFor ?? raw.looking_for;
  const lookingFor =
    lf == null || lf === '' ? null : String(lf).trim().slice(0, LOOKING_FOR_MAX_LENGTH) || null;
  const premiumUntil = raw.premiumUntil ?? raw.premium_until ?? null;
  const isPremium =
    typeof raw.isPremium === 'boolean'
      ? raw.isPremium
      : typeof raw.is_premium === 'boolean'
        ? raw.is_premium
        : !!premiumUntil && new Date(premiumUntil).getTime() > Date.now();
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    age: raw.age,
    photoUrl: raw.photoUrl ?? null,
    lookingFor,
    selectedGame: raw.selectedGame ?? null,
    state: raw.state,
    currentSessionId: raw.currentSessionId ?? null,
    currentMatchId: raw.currentMatchId ?? null,
    locale: raw.locale ?? 'en',
    premiumUntil,
    isPremium,
    gameProfiles: Array.isArray(raw.gameProfiles) ? raw.gameProfiles : [],
  };
}
