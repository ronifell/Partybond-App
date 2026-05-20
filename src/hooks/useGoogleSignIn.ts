import { useEffect, useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';

import { loginWithGoogle } from '../api/auth';
import { useAuth } from '../store/authStore';
import { getApiError } from '../api/client';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from '../config/env';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
  const { t, i18n } = useTranslation();
  const setSession = useAuth((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = !!GOOGLE_WEB_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID ?? undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID ?? GOOGLE_WEB_CLIENT_ID ?? undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID ?? GOOGLE_WEB_CLIENT_ID ?? undefined,
    redirectUri: makeRedirectUri({ scheme: 'partybond' }),
  });

  const completeSignIn = useCallback(
    async (idToken: string) => {
      setLoading(true);
      setError(null);
      try {
        const locale = i18n.language || Localization.getLocales()[0]?.languageCode || 'en';
        const res = await loginWithGoogle(idToken, locale);
        await setSession(res.token, res.user);
      } catch (err) {
        const apiErr = getApiError(err);
        setError(apiErr.message || t('auth.errors.generic'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [i18n.language, setSession, t],
  );

  useEffect(() => {
    if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setError(t('auth.errors.googleCancelled'));
      return;
    }
    if (response?.type !== 'success') return;
    const idToken = response.authentication?.idToken;
    if (!idToken) {
      setError(t('auth.errors.googleNoToken'));
      return;
    }
    void completeSignIn(idToken);
  }, [response, completeSignIn, t]);

  const signIn = useCallback(async () => {
    if (!configured) {
      setError(t('auth.errors.googleNotConfigured'));
      return;
    }
    if (!request) {
      setError(t('auth.errors.googleNotReady'));
      return;
    }
    setError(null);
    await promptAsync();
  }, [configured, promptAsync, request, t]);

  return {
    signIn,
    loading: loading || !request,
    error,
    clearError: () => setError(null),
    configured,
  };
}
