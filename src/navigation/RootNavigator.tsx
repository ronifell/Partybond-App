import React, { useEffect, useMemo } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../store/authStore';
import { connectSocket, disconnectSocket } from '../socket';
import { colors } from '../theme/tokens';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OnboardingNameScreen } from '../screens/OnboardingNameScreen';
import { OnboardingPhotoScreen } from '../screens/OnboardingPhotoScreen';
import { OnboardingGameScreen } from '../screens/OnboardingGameScreen';
import { OnboardingGameInfoScreen } from '../screens/OnboardingGameInfoScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateSessionScreen } from '../screens/CreateSessionScreen';
import { SessionScreen } from '../screens/SessionScreen';
import { QueueScreen } from '../screens/QueueScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditGameProfileScreen } from '../screens/EditGameProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg.base,
    card: colors.bg.base,
    text: colors.ink.primary,
    border: colors.bg.border,
    primary: colors.brand.purple,
  },
};

export function RootNavigator() {
  const { hydrated, token, user, hydrate } = useAuth();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (token) connectSocket(token);
    else disconnectSocket();
  }, [token]);

  const needsOnboarding = useMemo(() => {
    if (!user) return false;
    if (!user.selectedGame) return true;
    if (!user.gameProfiles.some((p) => p.gameId === user.selectedGame)) return true;
    return false;
  }, [user]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.base, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.brand.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.base } }}>
        {!token ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : needsOnboarding ? (
          <>
            <Stack.Screen name="OnboardingName" component={OnboardingNameScreen} />
            <Stack.Screen name="OnboardingPhoto" component={OnboardingPhotoScreen} />
            <Stack.Screen name="OnboardingGame" component={OnboardingGameScreen} />
            <Stack.Screen name="OnboardingGameInfo" component={OnboardingGameInfoScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
            <Stack.Screen name="Session" component={SessionScreen} />
            <Stack.Screen name="Queue" component={QueueScreen} />
            <Stack.Screen name="Match" component={MatchScreen} />
            <Stack.Screen name="EditGameProfile" component={EditGameProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
