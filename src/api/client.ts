import axios, { type AxiosError, type AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/env';

export const TOKEN_KEY = '@partybond/token';

let cachedToken: string | null = null;

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiErrorShape {
  code?: string;
  message: string;
  details?: unknown;
}

export function getApiError(err: unknown): ApiErrorShape {
  const e = err as AxiosError<{ error?: ApiErrorShape }>;
  const payload = e.response?.data?.error;
  if (payload) return payload;
  return { message: e.message || 'Network error' };
}
