import Constants from 'expo-constants';
import { Platform } from 'react-native';

const fromConstants = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

// Preferred source: `.env` via Expo's public env vars.
// Example: EXPO_PUBLIC_API_URL=http://179.197.64.25:4000
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

// ---------------------------------------------------------------------------
// Premium / Invite-link config (Google Play Billing + Share-a-friend referrals)
// ---------------------------------------------------------------------------

const premiumExtra = Constants.expoConfig?.extra as
  | { premiumProductIds?: string; inviteBaseUrl?: string }
  | undefined;

function pickString(envValue: string | undefined, extraValue: string | undefined): string {
  const fromEnv = envValue?.trim();
  if (fromEnv) return fromEnv;
  const fromExtra = extraValue?.trim();
  if (fromExtra) return fromExtra;
  return '';
}

const premiumProductIdsRaw = pickString(
  process.env.EXPO_PUBLIC_PREMIUM_PRODUCT_IDS,
  premiumExtra?.premiumProductIds,
);

/** Premium subscription product IDs registered in Google Play Console. */
export const PREMIUM_PRODUCT_IDS = (premiumProductIdsRaw || 'partybond.premium.monthly')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** Default product the upgrade button buys when the user hasn't explicitly picked one. */
export const PRIMARY_PREMIUM_PRODUCT_ID = PREMIUM_PRODUCT_IDS[0] ?? 'partybond.premium.monthly';

/**
 * Base URL of the backend invite landing page (e.g. https://api.partybond.com/i).
 * The /i/<code> route redirects to the Play Store / App Store. When unset, the app
 * falls back to a raw Play Store URL.
 */
export const INVITE_BASE_URL = pickString(
  process.env.EXPO_PUBLIC_INVITE_BASE_URL,
  premiumExtra?.inviteBaseUrl,
);

// ---------------------------------------------------------------------------
// Launch-day banner
// ---------------------------------------------------------------------------

const launchExtra = Constants.expoConfig?.extra as { launchAtIso?: string } | undefined;

/**
 * ISO 8601 datetime that marks the official launch moment
 * (e.g. `2026-07-16T21:00:00Z` for 18:00 in São Paulo, UTC-3).
 *
 * When set and still in the future the app shows a full-width banner on Home
 * telling users to come back at the launch time. Auto-hides after that moment
 * so no rebuild is needed the next day. Leave empty to disable entirely.
 */
export const LAUNCH_AT_ISO = pickString(
  process.env.EXPO_PUBLIC_LAUNCH_AT_ISO,
  launchExtra?.launchAtIso,
);

/** Parsed Date instance for LAUNCH_AT_ISO, or null when unset/invalid. */
export function getLaunchAt(): Date | null {
  if (!LAUNCH_AT_ISO) return null;
  const d = new Date(LAUNCH_AT_ISO);
  return Number.isNaN(d.getTime()) ? null : d;
}
