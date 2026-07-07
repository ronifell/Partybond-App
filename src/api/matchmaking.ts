import { api } from './client';
import type { MatchLobbyPreferences, QueueStatus } from './types';

export async function joinMatchmakingQueue(
  gameId: string,
  prefs: MatchLobbyPreferences,
): Promise<{ status: QueueStatus | null }> {
  const { data } = await api.post<{ ok: true; status: QueueStatus | null }>('/matchmaking/queue', {
    gameId,
    gameMode: prefs.gameMode,
    playStyle: prefs.playStyle,
    platform: prefs.platform,
  });
  return { status: data.status };
}

export async function leaveMatchmakingQueue(): Promise<void> {
  await api.delete('/matchmaking/queue');
}

export async function getMatchmakingQueueStatus(): Promise<QueueStatus | null> {
  const { data } = await api.get<{ status: QueueStatus | null }>('/matchmaking/queue/status');
  return data.status;
}
