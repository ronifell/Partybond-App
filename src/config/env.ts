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
 * On the Android emulator `localhost` / `127.0.0.1` refers to the emulator
 * itself, not the host machine. Remap to the special alias 10.0.2.2 so that
 * URLs typed as "localhost" in .env work transparently on the emulator.
 * Physical devices still need the machine's actual LAN IP in .env.
 */
function remapLocalhostForAndroid(url: string): string {
  if (Platform.OS !== 'android') return url;
  return url.replace(/localhost/g, '10.0.2.2').replace(/127\.0\.0\.1/g, '10.0.2.2');
}

/**
 * Base URL of the admin panel (Next.js). Set EXPO_PUBLIC_ADMIN_URL in Frontend/.env.
 * Optional — game images are loaded from the backend at `${API_URL}/game-images/<gameId>`.
 *
 * Local development:
 *   Android emulator  → EXPO_PUBLIC_ADMIN_URL=http://localhost:3000  (auto-remapped to 10.0.2.2)
 *   Physical device   → EXPO_PUBLIC_ADMIN_URL=http://<your-machine-LAN-IP>:3000
 * Production         → EXPO_PUBLIC_ADMIN_URL=https://admin.yourdomain.com
 */
export const ADMIN_URL = (() => {
  const raw = (process.env.EXPO_PUBLIC_ADMIN_URL ?? '').trim().replace(/\/$/, '');
  if (!raw) return null;
  return remapLocalhostForAndroid(raw);
})();

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

/** Prefer non-empty env, then app.config `extra` (APK/EAS builds). */
function pickGoogleId(envValue: string | undefined, extraValue: string | undefined): string {
  const fromEnv = envValue?.trim();
  if (fromEnv) return fromEnv;
  const fromExtra = extraValue?.trim();
  if (fromExtra) return fromExtra;
  return '';
}

export const GOOGLE_WEB_CLIENT_ID = pickGoogleId(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  googleExtra?.googleWebClientId,
);

export const GOOGLE_ANDROID_CLIENT_ID = pickGoogleId(
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  googleExtra?.googleAndroidClientId,
);

export const GOOGLE_IOS_CLIENT_ID = pickGoogleId(
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  googleExtra?.googleIosClientId,
);
