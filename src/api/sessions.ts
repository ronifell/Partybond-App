import { api } from './client';
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
  playersNeeded: 2 | 4;
  scheduledAt?: string;
}): Promise<SessionSummary> {
  const { data } = await api.post<{ session: SessionSummary }>('/sessions', input);
  return data.session;
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

/**
 * One-tap "Quick Join" for a game, scoped by **play style** and **skill tier** so you
 * only share a queue (and get matched) with players who picked the same lobby type.
 */
export async function quickJoinGame(
  gameId: string,
  prefs: MatchLobbyPreferences,
): Promise<{ sessionId: string }> {
  const sessions = await listSessions({
    gameId,
    gameMode: prefs.gameMode,
    skillTier: prefs.skillTier,
  });

  const eligible = sessions.filter((s) => s.status === 'open' || s.status === 'active');
  const byScheduledAt = (a: SessionSummary, b: SessionSummary) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();

  const withWaiters = eligible.filter((s) => s.waitingCount > 0).sort(byScheduledAt);
  const existing = withWaiters[0] ?? [...eligible].sort(byScheduledAt)[0];

  let sessionId = existing?.id;
  if (!sessionId) {
    const created = await createSession({
      gameId,
      title: 'Quick Match',
      gameMode: prefs.gameMode,
      skillTier: prefs.skillTier,
      playersNeeded: 2,
    });
    sessionId = created.id;
  }

  await joinQueue(sessionId);
  return { sessionId };
}
