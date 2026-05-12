import { api } from './client';
import type { Game } from './types';

export async function fetchGames(): Promise<Game[]> {
  const { data } = await api.get<{ games: Game[] }>('/games');
  return data.games;
}
