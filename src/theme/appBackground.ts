import type { ImageSourcePropType } from 'react-native';

/**
 * Login / Register screens — same art as before the split (`background.png`).
 * `LoginBackground` falls back here when `LOGIN_BACKGROUND` in `assets.ts` is null.
 */
export const AUTH_BACKGROUND_IMAGE: ImageSourcePropType =
  require('../../assets/background.png');

/**
 * Dark overlay on the auth background (0 = none, 1 = black).
 */
export const AUTH_BACKGROUND_OVERLAY = 0.2;

/**
 * App-wide background for every screen after sign-in (main stack + onboarding).
 * Uses `Frontend/assets/bg.png`.
 *
 * To use the code-generated arena background instead, set to `null`.
 */
export const APP_BACKGROUND_IMAGE: ImageSourcePropType | null =
  require('../../assets/bg.png');

/**
 * Dark overlay applied on top of the post-login background (0 = none, 1 = fully black).
 */
export const APP_BACKGROUND_OVERLAY = 0.2;
