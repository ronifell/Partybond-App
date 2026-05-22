import { api } from './client';
import { joinMatchmakingQueue } from './matchmaking';
import type { MatchLobbyPreferences, SessionDetail, SessionSummary } from './types';

export type ListSessionsParams = {
  gameId?: string;
  gameMode?: SessionSummary['gameMode'];
  skillTier?: SessionSummary['skillTier'];
};

export async function listSessions(params?: ListSessionsParams): Promise<SessionSummary[]> {
  const { data } = await api.get<{ sessions: SessionSummary[] }>('/sessions', {
    params: params ?? {},
  });
  return data.sessions;
}

export async function getSession(id: string): Promise<SessionDetail> {
  const { data } = await api.get<{ session: SessionDetail }>(`/sessions/${id}`);
  return data.session;
}

export async function createSession(input: {
  gameId: string;
  title: string;
  gameMode: 'casual' | 'competitive';
  skillTier?: SessionSummary['skillTier'];
  playersNeeded?: number;
  scheduledAt?: string;
}): Promise<SessionSummary> {
  const { data } = await api.post<{ session: SessionSummary }>('/sessions', input);
  return data.session;
}

export type SquadCandidate = {
  userId: string;
  name: string;
  photoUrl: string | null;
  nickname: string | null;
  isOnline: boolean;
  source: 'recent' | 'suggestion';
};

export async function fetchSquadCandidates(gameId: string): Promise<SquadCandidate[]> {
  const { data } = await api.get<{ candidates: SquadCandidate[] }>('/users/me/squad-candidates', {
    params: { gameId },
  });
  return data.candidates;
}

export type SessionSquadInvite = {
  id: string;
  sessionId: string;
  expiresAt: string;
  inviter: { id: string; name: string; photoUrl: string | null };
  session: { id: string; title: string; gameId: string; gameName: string };
};

export async function fetchPendingSessionSquadInvites(): Promise<SessionSquadInvite[]> {
  const { data } = await api.get<{ invites: SessionSquadInvite[] }>(
    '/sessions/squad-invites/pending',
  );
  return data.invites;
}

export async function sendSessionSquadInvites(sessionId: string, inviteeIds: string[]) {
  const { data } = await api.post<{ inviteIds: string[]; count: number }>(
    `/sessions/${sessionId}/squad-invites`,
    { inviteeIds },
  );
  return data;
}

export async function respondSessionSquadInvite(inviteId: string, accept: boolean) {
  const { data } = await api.post<{ ok: boolean; sessionId: string }>(
    `/sessions/squad-invites/${inviteId}/respond`,
    { accept },
  );
  return data;
}

export async function joinQueue(sessionId: string): Promise<{ waitingCount: number }> {
  const { data } = await api.post<{ ok: true; waitingCount: number }>(
    `/sessions/${sessionId}/queue`,
  );
  return { waitingCount: data.waitingCount };
}

export async function leaveQueue(sessionId: string): Promise<{ waitingCount: number }> {
  const { data } = await api.delete<{ ok: true; waitingCount: number }>(
    `/sessions/${sessionId}/queue`,
  );
  return { waitingCount: data.waitingCount };
}

/** Progressive matchmaking queue (relaxes criteria after 25s / 30s). */
export async function quickJoinGame(
  gameId: string,
  prefs: MatchLobbyPreferences,
): Promise<{ progressive: true; gameId: string }> {
  await joinMatchmakingQueue(gameId, prefs);
  return { progressive: true, gameId };
}
