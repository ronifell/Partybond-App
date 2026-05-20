import { useEffect, useState, useCallback, useMemo } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
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

function getExpoAuthProxyRedirectUri(): string {
  const fromEnv = process.env.EXPO_PUBLIC_EXPO_AUTH_PROXY_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;

  const fullName = Constants.expoConfig?.originalFullName;
  if (fullName && !fullName.startsWith('@anonymous/')) {
    return `https://auth.expo.io/${fullName}`;
  }

  const fromExtra = (
    Constants.expoConfig?.extra as { expoAuthProxyRedirectUri?: string } | undefined
  )?.expoAuthProxyRedirectUri?.trim();
  return fromExtra ?? '';
}

export function useGoogleSignIn() {
  const { t, i18n } = useTranslation();
  const setSession = useAuth((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const expoProxyRedirectUri = useMemo(
    () => (isExpoGo ? getExpoAuthProxyRedirectUri() : ''),
    [isExpoGo],
  );

  const googleAuthRequestConfig = useMemo(() => {
    const webId = GOOGLE_WEB_CLIENT_ID ?? undefined;
    const base = {
      webClientId: webId,
      iosClientId: GOOGLE_IOS_CLIENT_ID ?? webId,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID ?? webId,
    };

    // Expo Go: we will use the AuthSession proxy `/start` URL at prompt time.
    // Still use the Web client ID for native platforms so `client_id` matches the redirect allowlist.
    if (isExpoGo) {
      return {
        ...base,
        responseType: ResponseType.IdToken,
        shouldAutoExchangeCode: false,
        iosClientId: webId,
        androidClientId: webId,
      };
    }

    return base;
  }, [
    isExpoGo,
    expoProxyRedirectUri,
    GOOGLE_WEB_CLIENT_ID,
    GOOGLE_ANDROID_CLIENT_ID,
    GOOGLE_IOS_CLIENT_ID,
  ]);

  const configured =
    !!GOOGLE_WEB_CLIENT_ID && (!isExpoGo || !!expoProxyRedirectUri);

  // Standalone / dev client: native redirect com.<package>:/oauthredirect + Android OAuth client + SHA-1.
  // Expo Go: Web client redirect https://auth.expo.io/@owner/slug (see EXPO_PUBLIC_EXPO_AUTH_PROXY_REDIRECT_URI).
  const [request, response, promptAsync] = Google.useAuthRequest(googleAuthRequestConfig);

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
    const idToken = response.authentication?.idToken ?? response.params?.id_token;
    if (!idToken) {
      setError(t('auth.errors.googleNoToken'));
      return;
    }
    void completeSignIn(idToken);
  }, [response, completeSignIn, t]);

  const signIn = useCallback(async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      setError(t('auth.errors.googleNotConfigured'));
      return;
    }
    if (isExpoGo && !expoProxyRedirectUri) {
      setError(t('auth.errors.googleExpoProxyRedirect'));
      return;
    }
    if (!request) {
      setError(t('auth.errors.googleNotReady'));
      return;
    }
    setError(null);

    if (isExpoGo) {
      const authUrl = request.url;
      if (!authUrl) {
        setError(t('auth.errors.googleNotReady'));
        return;
      }

      // The proxy needs:
      // - `authUrl`: the provider URL that redirects back to the proxy redirect URL
      // - `returnUrl`: where the proxy should send the final response (deep link back into Expo Go)
      const u = new URL(authUrl);
      u.searchParams.set('redirect_uri', expoProxyRedirectUri);
      u.searchParams.set('client_id', GOOGLE_WEB_CLIENT_ID);

      const startUrl = `${expoProxyRedirectUri}/start?${new URLSearchParams({
        authUrl: u.toString(),
        returnUrl: request.redirectUri,
      }).toString()}`;

      await promptAsync({ url: startUrl });
      return;
    }

    await promptAsync();
  }, [GOOGLE_WEB_CLIENT_ID, expoProxyRedirectUri, isExpoGo, promptAsync, request, t]);

  return {
    signIn,
    loading: loading || !request,
    error,
    clearError: () => setError(null),
    configured,
  };
}
