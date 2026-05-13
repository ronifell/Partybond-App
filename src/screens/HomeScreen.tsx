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
import { BottomTabBar, type TabKey } from '../components/BottomTabBar';
import { listSessions, quickJoinGame } from '../api/sessions';
import { fetchGames } from '../api/games';
import { useAuth } from '../store/authStore';
import { useMatchEvents } from '../hooks/useMatchEvents';
import { getApiError } from '../api/client';
import { colors } from '../theme/tokens';

const QUICK_ACTIONS_HEIGHT = 96;
const TAB_BAR_HEIGHT = 90;
/** Extra scroll space so the last cards clear the four quick-action tiles (does not shrink the list viewport). */
const GAME_LIST_SCROLL_BOTTOM_PADDING = 132;

export function HomeScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const refreshMe = useAuth((s) => s.refreshMe);
  const qc = useQueryClient();

  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);

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
    queryFn: () => listSessions(undefined),
  });

  const queueByGame = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of allSessions) {
      map[s.gameId] = (map[s.gameId] ?? 0) + s.waitingCount;
    }
    return map;
  }, [allSessions]);

  const selectedGame = useMemo(
    () => games.find((g) => g.id === user?.selectedGame) ?? null,
    [games, user?.selectedGame],
  );

  useFocusEffect(
    useCallback(() => {
      void refetchGames();
      void refetchSessions();
      void refreshMe();
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
    } else if (user.state === 'in_queue' && user.currentSessionId) {
      navigation.navigate('Queue', { sessionId: user.currentSessionId });
    }
  }, [user, navigation]);

  const onJoinGame = async (gameId: string) => {
    setJoiningGameId(gameId);
    try {
      const { sessionId } = await quickJoinGame(gameId);
      await refreshMe();
      qc.invalidateQueries({ queryKey: ['sessions'] });
      navigation.navigate('Queue', { sessionId });
    } catch (err) {
      console.warn('Quick join failed', getApiError(err));
    } finally {
      setJoiningGameId(null);
    }
  };

  const tabs: Array<{
    key: TabKey;
    icon: 'home' | 'calendar' | 'people' | 'chatbubble' | 'person';
    label: string;
    onPress?: () => void;
  }> = [
    { key: 'home', icon: 'home', label: t('tabs.home'), onPress: () => {} },
    { key: 'sessions', icon: 'calendar', label: t('tabs.sessions'), onPress: () => {} },
    { key: 'matches', icon: 'people', label: t('tabs.matches') },
    { key: 'messages', icon: 'chatbubble', label: t('tabs.messages') },
    {
      key: 'profile',
      icon: 'person',
      label: t('tabs.profile'),
      onPress: () => navigation.navigate('Profile'),
    },
  ];

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
      <View style={{ flex: 1, marginBottom: QUICK_ACTIONS_HEIGHT + TAB_BAR_HEIGHT + 28 }}>
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
              onJoin={() => onJoinGame(item.id)}
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
          bottom: TAB_BAR_HEIGHT + 24,
        }}
        pointerEvents="box-none"
      >
        <QuickActionsRow
          actions={[
            {
              icon: 'add-circle',
              label: t('home.quickCreateSession'),
              primary: true,
              onPress: () => navigation.navigate('CreateSession'),
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
    </Screen>
  );
}
