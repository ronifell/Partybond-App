import { type User, LOOKING_FOR_MAX_LENGTH } from './types';

export type ApiUserPayload = User & { looking_for?: string | null };

/**
 * Ensures `lookingFor` is populated from API payloads (camelCase or snake_case).
 */
export function normalizeUser(raw: ApiUserPayload): User {
  const lf = raw.lookingFor ?? raw.looking_for;
  const lookingFor =
    lf == null || lf === '' ? null : String(lf).trim().slice(0, LOOKING_FOR_MAX_LENGTH) || null;
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
    gameProfiles: Array.isArray(raw.gameProfiles) ? raw.gameProfiles : [],
  };
}
