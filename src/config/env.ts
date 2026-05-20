import Constants from 'expo-constants';
import { Platform } from 'react-native';

const fromConstants = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

// Preferred source: `.env` via Expo's public env vars.
// Example: EXPO_PUBLIC_API_URL=http://18.231.112.145:4000
const fromProcessEnv = process.env.EXPO_PUBLIC_API_URL;

// Default backend URL for when no env/config is provided.
const defaultUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export const API_URL = fromProcessEnv ?? fromConstants ?? defaultUrl;

/**
 * Scheme + host + port only. Uploads are served at `${origin}/uploads/...`, not under `/api/v1`
 * (axios `baseURL` is `${API_URL}/api/v1`). Use this when building static asset URLs.
 */
export function getApiOrigin(): string {
  const raw = API_URL.trim().replace(/\/$/, '');
  const withoutApiSuffix = raw.replace(/\/api\/v1\/?$/i, '').replace(/\/api\/?$/i, '');
  try {
    const u = new URL(withoutApiSuffix.includes('://') ? withoutApiSuffix : `http://${withoutApiSuffix}`);
    return `${u.protocol}//${u.host}`;
  } catch {
    return withoutApiSuffix;
  }
}

export const SOCKET_URL = getApiOrigin();

const googleExtra = Constants.expoConfig?.extra as
  | {
      googleWebClientId?: string;
      googleAndroidClientId?: string;
      googleIosClientId?: string;
    }
  | undefined;

export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? googleExtra?.googleWebClientId ?? '';

export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? googleExtra?.googleAndroidClientId ?? '';

export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? googleExtra?.googleIosClientId ?? '';
