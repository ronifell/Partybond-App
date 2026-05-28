import type { ImageSourcePropType } from 'react-native';
import { ADMIN_URL } from '../config/env';

/**
 * Custom branding & content images.
 *
 * To enable an image:
 *   1. Drop your file at the indicated path under `Frontend/assets/`.
 *   2. Uncomment the matching `require(...)` line below.
 *   3. Reload Metro (press `r` in the Expo terminal).
 *
 * Leave any constant as `null` (or its map empty) to keep the code-rendered
 * fallback (e.g. the gradient "P" logo, or a generic game icon).
 */

// ──────────────────────────────────────────────────────────────────────
// 1) APP LOGO — the stylised "P" mark
//    Used on: Login hero, Top-of-Home header
//    Recommended: 512×512 PNG with a transparent background.
//    Path:  Frontend/assets/logo.png
// ──────────────────────────────────────────────────────────────────────
// export const APP_LOGO: ImageSourcePropType | null = null;
export const APP_LOGO: ImageSourcePropType | null = require('../../assets/logo.png');

// ──────────────────────────────────────────────────────────────────────
// 2) LOGIN BACKGROUND — full-bleed image just for the auth screens
//    (separate from the global app background — set in `appBackground.ts`).
//    Recommended: 1080×2400 portrait JPG/PNG. Best if it has dark areas
//    around the centre so the form is readable on top.
//    Path:  Frontend/assets/login-bg.png
// ──────────────────────────────────────────────────────────────────────
export const LOGIN_BACKGROUND: ImageSourcePropType | null = null;
// export const LOGIN_BACKGROUND: ImageSourcePropType | null = require('../../assets/login-bg.png');

/** Dark overlay strength on top of LOGIN_BACKGROUND (0 = none, 1 = black). */
export const LOGIN_BACKGROUND_OVERLAY = 0.35;

// ──────────────────────────────────────────────────────────────────────
// 2b) ONBOARDING — full-bleed behind every onboarding screen (welcome → complete)
//     Path:  Frontend/assets/onboarding.png
// ──────────────────────────────────────────────────────────────────────
export const ONBOARDING_WELCOME_BACKGROUND: ImageSourcePropType = require('../../assets/onboarding.png');

/** Dark overlay on top of onboarding art (readability on all onboarding steps). */
export const ONBOARDING_WELCOME_OVERLAY = 0.28;

// ──────────────────────────────────────────────────────────────────────
// 3) GAME IMAGES — served from the admin panel at runtime.
//    Set EXPO_PUBLIC_ADMIN_URL in Frontend/.env to the admin panel origin.
//    Example: EXPO_PUBLIC_ADMIN_URL=http://18.231.112.145:3000
//    Upload images via the admin panel's game management page; they are
//    saved as <gameId>.png under the admin panel's /games/ static route.
// ──────────────────────────────────────────────────────────────────────

/**
 * Returns a remote URI for the game's thumbnail, pointing at the admin panel.
 * Falls back to null (renders the gradient/icon placeholder) when
 * EXPO_PUBLIC_ADMIN_URL is not configured.
 */
export function getGameImage(gameId: string): ImageSourcePropType | null {
  if (!ADMIN_URL) return null;
  return { uri: `${ADMIN_URL}/games/${gameId}.png` };
}

// ──────────────────────────────────────────────────────────────────────
// 4) TEAM SCREEN BACKGROUND — mesh glow used on group/social/chat screens
//    Path:  Frontend/assets/team bg.png
// ──────────────────────────────────────────────────────────────────────
export const TEAM_SCREEN_BACKGROUND: ImageSourcePropType = require('../../assets/team bg.png');

/** @deprecated Use TEAM_SCREEN_BACKGROUND */
export const TEAM_CHAT_BACKGROUND = TEAM_SCREEN_BACKGROUND;
