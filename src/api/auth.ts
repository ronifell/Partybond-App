import { api } from './client';
import type { User } from './types';
import { normalizeUser, type ApiUserPayload } from './normalizeUser';

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return { ...data, user: normalizeUser(data.user as ApiUserPayload) };
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
  age: number;
  locale?: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', input);
  return { ...data, user: normalizeUser(data.user as ApiUserPayload) };
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return normalizeUser(data.user as ApiUserPayload);
}
