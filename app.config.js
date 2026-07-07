/**
 * Dynamic Expo config — loads EXPO_PUBLIC_* from the environment at build time
 * and copies Google OAuth IDs into `extra` so they work in APK/EAS builds
 * (not only in Expo Go where Metro reads .env on the fly).
 *
 * EAS cloud builds: .env is not uploaded (gitignored). Set EAS Secrets:
 *   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "..."
 *   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "..."
 */
const appJson = require('./app.json');

function pick(...values) {
  for (const v of values) {
    const t = typeof v === 'string' ? v.trim() : '';
    if (t) return t;
  }
  return '';
}

const googleWebClientId = pick(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
const googleAndroidClientId = pick(
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  googleWebClientId,
);
const googleIosClientId = pick(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, googleWebClientId);

const premiumProductIds = pick(process.env.EXPO_PUBLIC_PREMIUM_PRODUCT_IDS) || 'partybond.premium.monthly';
const inviteBaseUrl = pick(process.env.EXPO_PUBLIC_INVITE_BASE_URL);
const apiUrl = pick(process.env.EXPO_PUBLIC_API_URL, appJson.expo.extra?.apiUrl);

if (process.env.EAS_BUILD === 'true' && !googleWebClientId) {
  console.warn(
    '[Partybond] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing for this EAS build. ' +
      'Google Sign-In will fail in the APK. Add EAS Secrets or use `eas build --local` with Frontend/.env present.',
  );
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiUrl,
      googleWebClientId,
      googleAndroidClientId,
      googleIosClientId,
      premiumProductIds,
      inviteBaseUrl,
    },
  },
};
