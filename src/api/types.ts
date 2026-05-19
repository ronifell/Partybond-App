export interface GameProfile {
  gameId: string;
  nickname: string;
  playerId: string;
  platform?: string | null;
}

export type PlayStyle = 'relaxed' | 'focused';

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

export const SESSION_SKILL_TIERS = ['beginner', 'intermediate', 'advanced', 'veteran'] as const;
export type SessionSkillTier = (typeof SESSION_SKILL_TIERS)[number];

/** Chosen before joining progressive matchmaking (quick join). */
export interface MatchLobbyPreferences {
  gameMode: SessionMode;
  playStyle: PlayStyle;
}

export interface QueueStatus {
  gameId: string;
  gameMode: SessionMode;
  playStyle: PlayStyle;
  phase: 1 | 2 | 3;
  waitedSeconds: number;
  joinedAt: string;
}

export interface RecentPlayer {
  id: string;
  userId: string;
  nickname: string;
  photoUrl: string | null;
  gameId: string;
  gameName: string;
  platform: string | null;
  lastPlayedAt: string;
  isOnline: boolean;
}

export interface GroupInvite {
  id: string;
  group: { id: string; name: string; photoUrl: string | null };
  inviter: { id: string; name: string; photoUrl: string | null };
  expiresAt: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  photoUrl: string | null;
  createdById: string;
  memberCount: number;
  members: Array<{ id: string; name: string; photoUrl: string | null; role: string }>;
  createdAt: string;
  nextSession: { id: string; startsAt: string } | null;
}

export interface GroupDetail {
  id: string;
  name: string;
  photoUrl: string | null;
  createdById: string;
  createdAt: string;
  conversationId: string | null;
  members: Array<{ id: string; name: string; photoUrl: string | null; role: string; isOnline: boolean }>;
  schedules: Array<{ id: string; dayOfWeek: number; timeLocal: string; frequency: string; timezone: string }>;
  nextSession: {
    id: string;
    startsAt: string;
    rsvps: Array<{ userId: string; status: string }>;
  } | null;
}

export interface ConversationSummary {
  id: string;
  type: 'direct' | 'group';
  groupId: string | null;
  title?: string;
  photoUrl?: string | null;
  peer: { id: string; name: string; photoUrl: string | null } | null;
  participants: Array<{ id: string; name: string; photoUrl: string | null }>;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
}

export interface ChatMessage {
  id: string;
  body: string;
  senderId: string;
  sender: { id: string; name: string; photoUrl: string | null };
  replyToId: string | null;
  replyTo: { id: string; body: string; senderId: string } | null;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  photoUrl: string | null;
  lookingFor: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  gameProfiles: GameProfile[];
}

export interface SessionSummary {
  id: string;
  title: string;
  gameId: string;
  gameName: string;
  gameMode: SessionMode;
  skillTier: SessionSkillTier;
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
