import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as NavigationBar from 'expo-navigation-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuth } from './src/store/authStore';
import { usePushRegistration } from './src/hooks/usePushRegistration';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

function LocaleSync() {
  const { i18n } = useTranslation();
  const user = useAuth((s) => s.user);
  useEffect(() => {
    if (user?.locale && user.locale !== i18n.language) {
      void i18n.changeLanguage(user.locale);
    }
  }, [user?.locale, i18n]);
  return null;
}

function PushSync() {
  usePushRegistration();
  return null;
}

/**
 * Make the Android navigation/gesture bar transparent so the app's background
 * image draws underneath it (true edge-to-edge). No-op on iOS — iOS already
 * draws under the home indicator by default.
 */
function EdgeToEdgeAndroid() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void NavigationBar.setBackgroundColorAsync('#00000000');
    void NavigationBar.setButtonStyleAsync('light');
    void NavigationBar.setPositionAsync('absolute');
    void NavigationBar.setBehaviorAsync('overlay-swipe');
  }, []);
  return null;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#0A0A12' }} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <EdgeToEdgeAndroid />
        <LocaleSync />
        <PushSync />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
