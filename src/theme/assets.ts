import type { ImageSourcePropType } from 'react-native';

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
// 3) GAME IMAGES — thumbnails shown on Session cards & game tiles.
//    The key is the `Game.id` (must match what the backend seeds).
//    Recommended: square 512×512 PNG/JPG per game.
//    Path:  Frontend/assets/games/<gameId>.png
//
//    Currently seeded game ids:
//      free_fire | valorant | pubg_mobile | mobile_legends | cod_mobile
// ──────────────────────────────────────────────────────────────────────
export const GAME_IMAGES: Record<string, ImageSourcePropType> = {
  free_fire:      require('../../assets/games/free_fire.png'),
  valorant:       require('../../assets/games/valorant.png'),
  pubg_mobile:    require('../../assets/games/pubg_mobile.png'),
  mobile_legends: require('../../assets/games/mobile_legends.png'),
  cod_mobile:     require('../../assets/games/cod_mobile.png'),
};

/**
 * Look up a game image by id, or return null to render the gradient icon
 * fallback. Helper used by SessionCard / GameTile.
 */
export function getGameImage(gameId: string): ImageSourcePropType | null {
  return GAME_IMAGES[gameId] ?? null;
}
