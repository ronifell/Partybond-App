import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BottomTabBar, useBottomTabBarHeight } from '../components/BottomTabBar';
import { GroupInviteCard } from '../components/GroupInviteCard';
import { Avatar } from '../components/ui/Avatar';
import { HexagonFrame } from '../components/ui/HexagonFrame';
import { TeamScreenBackground } from '../components/ui/TeamScreenBackground';
import { useMainTabs } from '../hooks/useMainTabs';
import { useAuth } from '../store/authStore';
import {
  fetchGroups,
  fetchPendingGroupInvites,
  respondGroupInvite,
} from '../api/social';
import { fetchGames } from '../api/games';
import type { GroupSummary } from '../api/types';
import { getGameImage } from '../theme/assets';
import { colors, gradient } from '../theme/tokens';

const PURE_BLACK = '#000000';
const CARD_BG = '#0D0D12';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const SQUAD_MAX = 5;

type GroupsTab = 'all' | 'mine' | 'invites' | 'discover';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function GradientWord({ word }: { word: string }) {
  const [pink, mid, blue] = gradient.primary;
  return (
    <Svg height={32} width={word.length * 15}>
      <Defs>
        <SvgGradient id="groupsTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={blue} />
          <Stop offset="50%" stopColor={mid} />
          <Stop offset="100%" stopColor={pink} />
        </SvgGradient>
      </Defs>
      <SvgText fill="url(#groupsTitleGrad)" fontSize={26} fontWeight="800" x="0" y={28}>
        {word}
      </SvgText>
    </Svg>
  );
}

function formatCountdown(startsAt: string): string | null {
  const ms = new Date(startsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function GroupListCard({
  item,
  gameName,
  gameId,
  isLeader,
  onPress,
  onMenu,
  t,
}: {
  item: GroupSummary;
  gameName: string;
  gameId: string | null;
  isLeader: boolean;
  onPress: () => void;
  onMenu: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const photo = item.photoUrl ?? item.members.find((m) => m.role === 'admin')?.photoUrl;
  const countdown = item.nextSession ? formatCountdown(item.nextSession.startsAt) : null;
  const sessionStart = item.nextSession ? new Date(item.nextSession.startsAt) : null;
  const dayKey = sessionStart ? DAY_KEYS[sessionStart.getDay()] : null;
  const timeStr = sessionStart
    ? sessionStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const visibleMembers = item.members.slice(0, 4);
  const extraCount = item.memberCount - visibleMembers.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.groupCard, { opacity: pressed ? 0.94 : 1 }]}
    >
      <Pressable onPress={onMenu} hitSlop={10} style={styles.cardMenu}>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.ink.secondary} />
      </Pressable>

      <View style={styles.cardTop}>
        <View style={styles.cardAvatarWrap}>
          <Avatar uri={photo} name={item.name} size={56} />
          <View style={styles.cardOnlineDot} />
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            {isLeader ? (
              <Ionicons name="ribbon" size={14} color={colors.brand.purple} />
            ) : null}
          </View>

          {gameName ? (
            <View style={styles.cardGameRow}>
              {gameId && getGameImage(gameId) ? (
                <Image source={getGameImage(gameId)!} style={styles.cardGameIcon} />
              ) : (
                <Ionicons name="game-controller" size={12} color={colors.brand.blue} />
              )}
              <Text style={styles.cardGameName}>{gameName}</Text>
              <Text style={styles.cardMemberFrac}>
                {t('groups.membersFraction', {
                  current: item.memberCount,
                  max: SQUAD_MAX,
                })}
              </Text>
            </View>
          ) : (
            <Text style={styles.cardMemberFrac}>
              {t('groups.membersFraction', { current: item.memberCount, max: SQUAD_MAX })}
            </Text>
          )}

          {sessionStart && dayKey ? (
            <Text style={styles.cardSession}>
              {t('groups.nextSessionPrefix')}{' '}
              <Text style={styles.cardSessionTime}>
                {t(`groups.days.${dayKey}`)} {timeStr}
              </Text>
            </Text>
          ) : null}
        </View>

        {countdown ? (
          <View style={styles.countdownBox}>
            <Text style={styles.countdownLabel}>{t('groups.nextIn')}</Text>
            <Text style={styles.countdownValue}>{countdown}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.memberStack}>
        {visibleMembers.map((m) => (
          <View key={m.id} style={styles.stackAvatar}>
            <Avatar uri={m.photoUrl} name={m.name} size={28} glow={false} />
          </View>
        ))}
        {extraCount > 0 ? (
          <View style={styles.stackMore}>
            <Text style={styles.stackMoreText}>+{extraCount}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function GroupsScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const tabs = useMainTabs(navigation, 'sessions');
  const tabBarHeight = useBottomTabBarHeight();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [activeTab, setActiveTab] = useState<GroupsTab>('all');

  const { data: groups = [], refetch: refetchGroups, isRefetching } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  });

  const {
    data: invites = [],
    refetch: refetchInvites,
    isRefetching: invitesRefetching,
  } = useQuery({
    queryKey: ['group-invites', 'pending'],
    queryFn: fetchPendingGroupInvites,
  });

  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });

  const gameName = useMemo(() => {
    const id = user?.selectedGame;
    return games.find((g) => g.id === id)?.name ?? '';
  }, [games, user?.selectedGame]);

  useFocusEffect(
    useCallback(() => {
      void refetchInvites();
      void refetchGroups();
    }, [refetchInvites, refetchGroups]),
  );

  const onRefresh = () => {
    void refetchGroups();
    void refetchInvites();
  };

  const onRespondInvite = async (inviteId: string, accept: boolean, groupId?: string) => {
    const result = await respondGroupInvite(inviteId, accept);
    await qc.invalidateQueries({ queryKey: ['group-invites', 'pending'] });
    await qc.invalidateQueries({ queryKey: ['groups'] });
    if (accept) {
      const id = groupId ?? (result as { groupId?: string }).groupId;
      if (id) navigation.navigate('GroupDetail', { groupId: id });
    }
  };

  const filteredGroups = useMemo(() => {
    if (activeTab === 'mine' && user) {
      return groups.filter(
        (g) =>
          g.createdById === user.id ||
          g.members.some((m) => m.id === user.id && m.role === 'admin'),
      );
    }
    if (activeTab === 'all') return groups;
    return [];
  }, [groups, activeTab, user]);

  const openGroupMenu = (item: GroupSummary) => {
    Alert.alert(item.name, undefined, [
      {
        text: t('groups.openGroup'),
        onPress: () => navigation.navigate('GroupDetail', { groupId: item.id }),
      },
      {
        text: t('groups.openChat'),
        onPress: () =>
          navigation.navigate('GroupDetail', { groupId: item.id }),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <LinearGradient
        colors={['rgba(123,63,242,0.12)', 'transparent']}
        style={styles.headerGlow}
        pointerEvents="none"
      />

      <View style={styles.titleRow}>
        <View>
          <View style={styles.titleLine}>
            <Text style={styles.titleMy}>{t('groups.titleMy')} </Text>
            <GradientWord word={t('groups.titleAccent')} />
          </View>
          <Text style={styles.subtitle}>{t('groups.subtitle')}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('CreateGroup')}
          style={({ pressed }) => [styles.addCircle, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={[...gradient.primary]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => navigation.navigate('CreateGroup')}
          style={({ pressed }) => [styles.actionCard, { opacity: pressed ? 0.92 : 1 }]}
        >
          <View style={styles.actionCardIcon}>
            <HexagonFrame size={44} accent="purple">
              <View style={styles.hexIconInner}>
                <Ionicons name="people" size={20} color={colors.brand.purple} />
              </View>
            </HexagonFrame>
          </View>
          <View style={styles.actionCardText}>
            <Text style={styles.actionCardTitle} numberOfLines={1}>
              {t('groups.createCardTitle')}
            </Text>
            <Text style={styles.actionCardBody} numberOfLines={2}>
              {t('groups.createCardBody')}
            </Text>
          </View>
          <View style={styles.chevronBtn} pointerEvents="none">
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('invites')}
          style={({ pressed }) => [styles.actionCard, { opacity: pressed ? 0.92 : 1 }]}
        >
          <View style={styles.actionCardIcon}>
            <View style={styles.inviteIconBox}>
              <Ionicons name="person-add" size={20} color={colors.brand.purple} />
            </View>
          </View>
          <View style={styles.actionCardText}>
            <Text style={styles.actionCardTitle} numberOfLines={1}>
              {t('groups.invitesCardTitle')}
            </Text>
            <Text style={styles.invitesPending} numberOfLines={1}>
              {t('groups.invitesPending', { count: invites.length })}
            </Text>
          </View>
          <View style={styles.chevronBtn} pointerEvents="none">
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </View>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {(
          [
            { key: 'all' as const, label: t('groups.tabAll') },
            { key: 'mine' as const, label: t('groups.tabMine') },
            { key: 'invites' as const, label: t('groups.tabInvites') },
            { key: 'discover' as const, label: t('groups.tabDiscover') },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={styles.tabItem}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              {active ? (
                <LinearGradient
                  colors={[colors.brand.blue, colors.brand.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabUnderline}
                />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const listFooter = (
    <Pressable
      onPress={() => navigation.navigate('RecentPlayers')}
      style={({ pressed }) => [styles.discoverCard, { opacity: pressed ? 0.92 : 1 }]}
    >
      <LinearGradient
        colors={['rgba(0,209,255,0.2)', 'rgba(123,63,242,0.25)']}
        style={styles.discoverIcon}
      >
        <Ionicons name="person-add-outline" size={24} color={colors.brand.blue} />
      </LinearGradient>
      <View style={styles.discoverText}>
        <Text style={styles.discoverTitle}>{t('groups.findPlayersTitle')}</Text>
        <Text style={styles.discoverBody}>{t('groups.findPlayersBody')}</Text>
      </View>
      <LinearGradient
        colors={[colors.brand.pink, colors.brand.blue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.discoverBtn}
      >
        <Text style={styles.discoverBtnText}>{t('groups.tabDiscover')}</Text>
      </LinearGradient>
    </Pressable>
  );

  const renderContent = () => {
    if (activeTab === 'invites') {
      if (invites.length === 0) {
        return (
          <Text style={styles.empty}>{t('groups.invitesEmpty')}</Text>
        );
      }
      return invites.map((invite) => (
        <GroupInviteCard
          key={invite.id}
          invite={invite}
          onAccept={() => onRespondInvite(invite.id, true, invite.group.id)}
          onDecline={() => onRespondInvite(invite.id, false)}
        />
      ));
    }

    if (activeTab === 'discover') {
      return (
        <View style={styles.discoverPanel}>
          <Text style={styles.discoverPanelText}>{t('groups.discoverHint')}</Text>
          <Pressable
            onPress={() => navigation.navigate('RecentPlayers')}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <LinearGradient
              colors={[...gradient.primary]}
              style={styles.discoverPanelBtn}
            >
              <Text style={styles.discoverPanelBtnText}>{t('groups.tabDiscover')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      );
    }

    if (filteredGroups.length === 0) {
      return <Text style={styles.empty}>{t('groups.empty')}</Text>;
    }

    return filteredGroups.map((item) => {
      const isLeader =
        !!user &&
        (item.createdById === user.id ||
          item.members.some((m) => m.id === user.id && m.role === 'admin'));
      return (
        <GroupListCard
          key={item.id}
          item={item}
          gameName={gameName}
          gameId={user?.selectedGame ?? null}
          isLeader={isLeader}
          onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
          onMenu={() => openGroupMenu(item)}
          t={t}
        />
      );
    });
  };

  return (
    <TeamScreenBackground style={styles.root}>
      <StatusBar style="light" backgroundColor={PURE_BLACK} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <FlatList
          data={[{ key: 'content' }]}
          keyExtractor={(i) => i.key}
          ListHeaderComponent={listHeader}
          renderItem={() => <View style={styles.listBody}>{renderContent()}</View>}
          ListFooterComponent={activeTab !== 'invites' ? listFooter : null}
          contentContainerStyle={{
            paddingBottom: tabBarHeight + 16,
          }}
          refreshing={isRefetching || invitesRefetching}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
      <BottomTabBar active="sessions" tabs={tabs} />
    </TeamScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  titleMy: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.ink.secondary,
    fontSize: 13,
    marginTop: 6,
  },
  addCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(123,63,242,0.5)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingVertical: 12,
    paddingLeft: 10,
    paddingRight: 36,
    minHeight: 72,
  },
  actionCardIcon: {
    flexShrink: 0,
    marginRight: 8,
  },
  hexIconInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(123,63,242,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123,63,242,0.35)',
  },
  actionCardText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  actionCardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  actionCardBody: {
    color: colors.ink.disabled,
    fontSize: 10,
    marginTop: 3,
    lineHeight: 14,
  },
  invitesPending: {
    color: colors.brand.purple,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  chevronBtn: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabsScroll: {
    gap: 20,
    paddingBottom: 12,
  },
  tabItem: {
    paddingBottom: 8,
    position: 'relative',
  },
  tabText: {
    color: colors.ink.disabled,
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  listBody: {
    paddingHorizontal: 16,
    gap: 12,
  },
  groupCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    position: 'relative',
  },
  cardMenu: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingRight: 20,
  },
  cardAvatarWrap: {
    position: 'relative',
  },
  cardOnlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00E676',
    borderWidth: 2,
    borderColor: CARD_BG,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  cardGameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
  },
  cardGameIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  cardGameName: {
    color: colors.ink.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  cardMemberFrac: {
    color: colors.ink.disabled,
    fontSize: 12,
  },
  cardSession: {
    color: colors.ink.secondary,
    fontSize: 12,
    marginTop: 6,
  },
  cardSessionTime: {
    color: colors.brand.blue,
    fontWeight: '700',
  },
  countdownBox: {
    alignItems: 'flex-end',
    minWidth: 56,
  },
  countdownLabel: {
    color: colors.ink.disabled,
    fontSize: 9,
    fontWeight: '700',
  },
  countdownValue: {
    color: colors.brand.blue,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  memberStack: {
    flexDirection: 'row',
    marginTop: 12,
    paddingLeft: 4,
  },
  stackAvatar: {
    marginLeft: -8,
    borderWidth: 2,
    borderColor: CARD_BG,
    borderRadius: 16,
  },
  stackMore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -8,
    backgroundColor: '#1A1A24',
    borderWidth: 2,
    borderColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackMoreText: {
    color: colors.ink.secondary,
    fontSize: 10,
    fontWeight: '800',
  },
  empty: {
    color: colors.ink.secondary,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    marginTop: 8,
    gap: 12,
  },
  discoverIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverText: {
    flex: 1,
    minWidth: 0,
  },
  discoverTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  discoverBody: {
    color: colors.ink.disabled,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  discoverBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  discoverBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  discoverPanel: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  discoverPanelText: {
    color: colors.ink.secondary,
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 20,
  },
  discoverPanelBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  discoverPanelBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
