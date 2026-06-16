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
  inviteCode?: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', input);
  return { ...data, user: normalizeUser(data.user as ApiUserPayload) };
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return normalizeUser(data.user as ApiUserPayload);
}

export async function requestPasswordReset(identifier: string): Promise<{ ok: boolean }> {
  const { data } = await api.post<{ ok: boolean }>('/auth/forgot-password', { identifier });
  return data;
}

export async function resetPassword(
  identifier: string,
  code: string,
  password: string,
): Promise<{ ok: boolean }> {
  const { data } = await api.post<{ ok: boolean }>('/auth/reset-password', {
    identifier,
    code,
    password,
  });
  return data;
}

export async function loginWithGoogle(idToken: string, locale?: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/google', { idToken, locale });
  return { ...data, user: normalizeUser(data.user as ApiUserPayload) };
}
