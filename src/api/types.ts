export interface GameProfile {
  gameId: string;
  nickname: string;
  playerId: string;
}

export type UserState = 'idle' | 'in_queue' | 'in_match';

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  photoUrl: string | null;
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
}
