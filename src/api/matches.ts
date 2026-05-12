import { api } from './client';
import type { Match } from './types';

export type InteractionType =
  | 'add_me'
  | 'already_added'
  | 'enter_lobby'
  | 'waiting'
  | 'did_not_work';

export async function getMatch(id: string): Promise<Match> {
  const { data } = await api.get<{ match: Match }>(`/matches/${id}`);
  return data.match;
}

export async function sendInteraction(matchId: string, type: InteractionType): Promise<void> {
  await api.post(`/matches/${matchId}/interactions`, { type });
}

export async function finishMatch(matchId: string): Promise<void> {
  await api.post(`/matches/${matchId}/finish`);
}
