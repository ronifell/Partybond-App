import { api } from './client';
import type { SessionDetail, SessionSummary } from './types';

export async function listSessions(gameId?: string): Promise<SessionSummary[]> {
  const { data } = await api.get<{ sessions: SessionSummary[] }>('/sessions', {
    params: { gameId },
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
 * One-tap "Quick Join" for a game:
 *   1. Find an existing open / active session for the game.
 *   2. If none, create a fresh "Quick Match" session.
 *   3. Join that session's queue.
 *
 * Prefers sessions that **already have people in the queue** so we pair with
 * an existing waiter instead of the first empty session (API order is
 * `scheduledAt` asc, which often leaves stale "Quick Match" rows ahead of
 * real lobbies).
 *
 * Returns the session id the user was placed in (so callers can navigate to
 * the Queue screen).
 */
export async function quickJoinGame(gameId: string): Promise<{ sessionId: string }> {
  const sessions = await listSessions(gameId);

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
      gameMode: 'casual',
      playersNeeded: 2,
    });
    sessionId = created.id;
  }

  await joinQueue(sessionId);
  return { sessionId };
}
