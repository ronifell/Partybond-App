import { api } from './client';
import type { User } from './types';

export async function updateProfile(input: Partial<Pick<User, 'name' | 'age' | 'locale' | 'selectedGame'>>): Promise<User> {
  const { data } = await api.patch<{ user: User }>('/users/me', input);
  return data.user;
}

export async function uploadProfilePhoto(uri: string): Promise<User> {
  const form = new FormData();
  // React Native's FormData accepts this shape
  form.append('photo', {
    uri,
    name: `photo-${Date.now()}.jpg`,
    type: 'image/jpeg',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  const { data } = await api.post<{ user: User }>('/users/me/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.user;
}

export async function setGameProfile(input: {
  gameId: string;
  nickname: string;
  playerId: string;
}): Promise<User> {
  const { data } = await api.put<{ user: User }>('/users/me/game-profile', input);
  return data.user;
}

export async function setFcmToken(token: string | null): Promise<void> {
  await api.put('/users/me/fcm-token', { token });
}
