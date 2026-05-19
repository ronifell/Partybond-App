import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { GameCard } from '../components/GameCard';
import { HeaderBar } from '../components/HeaderBar';
import { ProfilePill } from '../components/ProfilePill';
import { QuickActionsRow } from '../components/QuickActionsRow';
import { BottomTabBar, useBottomTabBarHeight } from '../components/BottomTabBar';
import { useMainTabs } from '../hooks/useMainTabs';
import { listSessions, quickJoinGame } from '../api/sessions';
import { fetchGames } from '../api/games';
import type { MatchLobbyPreferences } from '../api/types';
import { MatchPreferencesModal } from '../components/MatchPreferencesModal';
import { GameProfileRequiredNotice } from '../components/GameProfileRequiredNotice';
import { useAuth } from '../store/authStore';
import { useMatchEvents } from '../hooks/useMatchEvents';
import { getApiError } from '../api/client';
import { colors } from '../theme/tokens';

const QUICK_ACTIONS_HEIGHT = 96;
/** Extra scroll space so the last cards clear the four quick-action tiles (does not shrink the list viewport). */
const GAME_LIST_SCROLL_BOTTOM_PADDING = 132;

export function HomeScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const tabBarHeight = useBottomTabBarHeight();
  const user = useAuth((s) => s.user);
  const refreshMe = useAuth((s) => s.refreshMe);
  const qc = useQueryClient();

  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);
  const [prefModalGame, setPrefModalGame] = useState<{ id: string; name: string } | null>(null);
  const [profileGateGame, setProfileGateGame] = useState<{ id: string; name: string } | null>(null);

  // All games (the new "Active Sessions" list).
  const {
    data: games = [],
    refetch: refetchGames,
    isRefetching: isRefetchingGames,
    isLoading: gamesLoading,
  } = useQuery({ queryKey: ['games'], queryFn: fetchGames });

  // Per-game queue counts: aggregate `waitingCount` from active sessions.
  const { data: allSessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => listSessions(),
  });

  const queueByGame = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of allSessions) {
      map[s.gameId] = (map[s.gameId] ?? 0) + s.waitingCount;
    }
    return map;
  }, [allSessions]);

  const hasGameProfile = useCallback(
    (gameId: string) => (user?.gameProfiles ?? []).some((p) => p.gameId === gameId),
    [user?.gameProfiles],
  );

  const selectedGame = useMemo(
    () => games.find((g) => g.id === user?.selectedGame) ?? null,
    [games, user?.selectedGame],
  );

  useFocusEffect(
    useCallback(() => {
      void refetchGames();
      void refetchSessions();
      void refreshMe();
      return () => {
        setJoiningGameId(null);
        setPrefModalGame(null);
        setProfileGateGame(null);
      };
    }, [refetchGames, refetchSessions, refreshMe]),
  );

  useMatchEvents((payload) => {
    navigation.navigate('Match', { matchId: payload.matchId });
  });

  // Auto-resume in-flight sessions/matches.
  useEffect(() => {
    if (!user) return;
    if (user.state === 'in_match' && user.currentMatchId) {
      navigation.navigate('Match', { matchId: user.currentMatchId });
    } else if (user.state === 'in_queue') {
      if (user.currentSessionId) {
        navigation.navigate('Queue', { sessionId: user.currentSessionId });
      } else {
        navigation.navigate('Queue', { progressive: true, gameId: user.selectedGame ?? undefined });
      }
    }
  }, [user, navigation]);

  const onJoinGame = async (gameId: string, prefs: MatchLobbyPreferences) => {
    setJoiningGameId(gameId);
    try {
      await quickJoinGame(gameId, prefs);
      await refreshMe();
      qc.invalidateQueries({ queryKey: ['sessions'] });
      navigation.navigate('Queue', { progressive: true, gameId });
    } catch (err) {
      console.warn('Quick join failed', getApiError(err));
      setJoiningGameId(null);
    }
  };

  const tabs = useMainTabs(navigation, 'home');

  return (
    <Screen padded={false}>
      {/* Top fixed area — header + profile pill */}
      <View style={{ paddingHorizontal: 12, paddingTop: 0 }}>
        <HeaderBar notifications={3} />
        <View style={{ marginTop: 6, marginBottom: 0 }}>
          <ProfilePill
            user={user}
            selectedGame={selectedGame}
            level={1}
            stars={0}
            onPressProfile={() => navigation.navigate('Profile')}
            // The game pill is now informational only — no separate Pick a Game screen.
            onPressGame={undefined}
          />
        </View>
      </View>

      {/* Fixed "Active Sessions" header — does not scroll */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingTop: 6,
          paddingBottom: 2,
        }}
      >
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 }}>
          {t('home.activeSessionsTitle')}
        </Text>
        <Pressable
          onPress={() => refetchGames()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ color: colors.brand.pink, fontSize: 13, fontWeight: '700' }}>
            {t('home.seeAll')}
          </Text>
        </Pressable>
      </View>

      {/* Scrollable game list — constrained to the space above the quick actions + tab bar */}
      <View style={{ flex: 1, marginBottom: QUICK_ACTIONS_HEIGHT + tabBarHeight + 28 }}>
        <FlatList
          data={games}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: GAME_LIST_SCROLL_BOTTOM_PADDING,
            gap: 12,
          }}
          renderItem={({ item }) => (
            <GameCard
              game={item}
              playersOnline={queueByGame[item.id] ?? 0}
              loading={joiningGameId === item.id}
              onJoin={() => {
                if (!hasGameProfile(item.id)) {
                  setProfileGateGame({ id: item.id, name: item.name });
                  return;
                }
                setPrefModalGame({ id: item.id, name: item.name });
              }}
            />
          )}
          ListEmptyComponent={
            !gamesLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Ionicons name="search" size={40} color={colors.ink.disabled} />
                <Text style={{ color: colors.ink.secondary, marginTop: 14, textAlign: 'center' }}>
                  {t('home.empty')}
                </Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingGames}
              onRefresh={() => {
                refetchGames();
                refetchSessions();
              }}
              tintColor={colors.brand.purple}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Sticky Quick Actions — sits above the bottom tab bar */}
      <View
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: tabBarHeight + 24,
        }}
        pointerEvents="box-none"
      >
        <QuickActionsRow
          actions={[
            {
              icon: 'add-circle',
              label: t('home.quickCreateSession'),
              primary: true,
              onPress: () =>
                navigation.navigate('CreateSession', {
                  defaultGameId: user?.selectedGame ?? undefined,
                }),
            },
            {
              icon: 'game-controller',
              label: t('home.quickMySessions'),
              onPress: () => refetchGames(),
            },
            {
              icon: 'person-circle',
              label: t('home.quickMyProfile'),
              onPress: () => navigation.navigate('Profile'),
            },
            {
              icon: 'people-circle',
              label: t('home.quickInviteFriends'),
            },
          ]}
        />
      </View>

      <BottomTabBar active="home" tabs={tabs} />

      <MatchPreferencesModal
        visible={!!prefModalGame}
        gameId={prefModalGame?.id}
        gameName={prefModalGame?.name}
        onClose={() => setPrefModalGame(null)}
        onConfirm={(prefs) => {
          const g = prefModalGame;
          setPrefModalGame(null);
          if (g) void onJoinGame(g.id, prefs);
        }}
      />

      {profileGateGame ? (
        <GameProfileRequiredNotice
          gameName={profileGateGame.name}
          onDismiss={() => setProfileGateGame(null)}
          onGoToProfile={() => {
            const g = profileGateGame;
            setProfileGateGame(null);
            if (g) navigation.navigate('EditGameProfile', { gameId: g.id });
          }}
        />
      ) : null}
    </Screen>
  );
}
