import React, { useEffect, useMemo } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../store/authStore';
import { connectSocket, disconnectSocket } from '../socket';
import { colors } from '../theme/tokens';
import { GlobalInviteOverlay } from '../components/GlobalInviteOverlay';
import { useGroupSocketEvents } from '../hooks/useGroupSocketEvents';
import { useSessionSquadRealtime } from '../hooks/useSessionSquadRealtime';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
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
import { RecentPlayersScreen } from '../screens/RecentPlayersScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';
import { ChatsScreen } from '../screens/ChatsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { AddToGroupScreen } from '../screens/AddToGroupScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { OnboardingWelcomeScreen } from '../screens/OnboardingWelcomeScreen';
import { OnboardingCompleteScreen } from '../screens/OnboardingCompleteScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { InviteFriendsScreen } from '../screens/InviteFriendsScreen';
import { AutoGroupScreen } from '../screens/AutoGroupScreen';
import { useOnboarding } from '../store/onboardingStore';

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

function AuthenticatedRealtimeLayer() {
  useGroupSocketEvents();
  useSessionSquadRealtime();
  return <GlobalInviteOverlay />;
}

export function RootNavigator() {
  const { hydrated, token, user, hydrate } = useAuth();
  const celebrationPending = useOnboarding((s) => s.celebrationPending);

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

  const showOnboardingStack = needsOnboarding || celebrationPending;

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.base, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.brand.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <View style={{ flex: 1 }}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.base } }}>
          {!token ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>
          ) : showOnboardingStack ? (
            <>
              <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
              <Stack.Screen name="OnboardingName" component={OnboardingNameScreen} />
              <Stack.Screen name="OnboardingPhoto" component={OnboardingPhotoScreen} />
              <Stack.Screen name="OnboardingGame" component={OnboardingGameScreen} />
              <Stack.Screen name="OnboardingGameInfo" component={OnboardingGameInfoScreen} />
              <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
              <Stack.Screen name="Session" component={SessionScreen} />
              <Stack.Screen name="Queue" component={QueueScreen} />
              <Stack.Screen name="Match" component={MatchScreen} />
              <Stack.Screen
                name="EditGameProfile"
                component={EditGameProfileScreen}
                options={{ contentStyle: { backgroundColor: '#000000' } }}
              />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="RecentPlayers" component={RecentPlayersScreen} />
              <Stack.Screen
                name="CreateGroup"
                component={CreateGroupScreen}
                options={{ contentStyle: { backgroundColor: '#000000' } }}
              />
              <Stack.Screen name="Groups" component={GroupsScreen} />
              <Stack.Screen
                name="GroupDetail"
                component={GroupDetailScreen}
                options={{ contentStyle: { backgroundColor: '#000000' } }}
              />
              <Stack.Screen name="Chats" component={ChatsScreen} />
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{ contentStyle: { backgroundColor: '#000000' } }}
              />
              <Stack.Screen name="UserProfile" component={UserProfileScreen} />
              <Stack.Screen
                name="AddToGroup"
                component={AddToGroupScreen}
                options={{ contentStyle: { backgroundColor: '#000000' } }}
              />
              <Stack.Screen
                name="Premium"
                component={PremiumScreen}
                options={{ contentStyle: { backgroundColor: '#000000' } }}
              />
              <Stack.Screen
                name="InviteFriends"
                component={InviteFriendsScreen}
                options={{ contentStyle: { backgroundColor: '#000000' } }}
              />
              <Stack.Screen
                name="AutoGroup"
                component={AutoGroupScreen}
                options={{ contentStyle: { backgroundColor: '#000000' } }}
              />
            </>
          )}
        </Stack.Navigator>

        {token && !showOnboardingStack ? <AuthenticatedRealtimeLayer /> : null}
      </View>
    </NavigationContainer>
  );
}
