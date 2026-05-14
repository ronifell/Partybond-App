export interface GameProfile {
  gameId: string;
  nickname: string;
  playerId: string;
}

export type UserState = 'idle' | 'in_queue' | 'in_match';

/** Max length for `User.lookingFor` (must match backend Zod + DB). */
export const LOOKING_FOR_MAX_LENGTH = 200;

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  photoUrl: string | null;
  /** What the player is looking for in the app (max {@link LOOKING_FOR_MAX_LENGTH} characters). */
  lookingFor: string | null;
  selectedGame: string | null;
  state: UserState;
  currentSessionId: string | null;
  currentMatchId: string | null;
  locale: string;
  gameProfiles: GameProfile[];
}

export interface Game {
  id: string;
  name: string;
  status: 'active' | 'coming_soon';
  maxPlayers: number;
}

export type SessionStatus = 'open' | 'active' | 'finished';
export type SessionMode = 'casual' | 'competitive';

export interface SessionSummary {
  id: string;
  title: string;
  gameId: string;
  gameName: string;
  gameMode: SessionMode;
  playersNeeded: number;
  scheduledAt: string;
  status: SessionStatus;
  createdBy: { id: string; name: string; photoUrl: string | null };
  waitingCount: number;
}

export interface SessionDetail extends Omit<SessionSummary, 'waitingCount'> {
  waiting: Array<{ id: string; name: string; photoUrl: string | null }>;
}

export interface MatchParticipant {
  id: string;
  name: string;
  photoUrl: string | null;
  nickname: string | null;
  playerId: string | null;
  /** In-app goal text from that player's profile (same as `User.lookingFor`). Omitted on older API responses. */
  lookingFor?: string | null;
}

/** Mirrors backend `InteractionType` / quick-action payloads. */
export type MatchInteractionType =
  | 'add_me'
  | 'already_added'
  | 'enter_lobby'
  | 'waiting'
  | 'did_not_work';

export interface MatchInteraction {
  id: string;
  userId: string;
  type: MatchInteractionType;
  createdAt: string;
}

export interface Match {
  id: string;
  status: 'active' | 'finished' | 'expired';
  gameId: string;
  gameName: string;
  sessionId: string;
  expiresAt: string;
  startedAt: string;
  endedAt: string | null;
  me: MatchParticipant;
  opponent: MatchParticipant;
  interactions: MatchInteraction[];
}
