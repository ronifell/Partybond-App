import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BottomTabBar, useBottomTabBarHeight } from '../components/BottomTabBar';
import { GroupInviteCard } from '../components/GroupInviteCard';
import { Logo } from '../components/ui/Logo';
import { Avatar } from '../components/ui/Avatar';
import { TeamScreenBackground } from '../components/ui/TeamScreenBackground';
import { useMainTabs } from '../hooks/useMainTabs';
import {
  fetchPendingGroupInvites,
  fetchRecentPlayers,
  respondGroupInvite,
} from '../api/social';
import type { RecentPlayer } from '../api/types';
import { getGameImage } from '../theme/assets';
import { colors, gradient } from '../theme/tokens';

const PURE_BLACK = '#000000';
const CARD_BG = '#0D0D12';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const GAME_ACCENT = '#E8A84A';
const ACTION_COLORS = {
  profile: { icon: colors.brand.blue, label: '#5BC4E8' },
  play: { icon: colors.brand.purple, label: '#A98AF5' },
  add: { icon: colors.brand.pink, label: '#FF7DBF' },
} as const;

const CREATE_GROUP_DOCK_HEIGHT = 82;

type FilterKey = 'all' | 'online' | 'invitations';

function formatPlayedAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Today • ${time}`;
  if (isYesterday) return `Yesterday • ${time}`;
  return `${d.toLocaleDateString()} • ${time}`;
}

function GradientTitleWord({ word }: { word: string }) {
  const [pink, mid, blue] = gradient.primary;
  return (
    <Svg height={34} width={word.length * 18}>
      <Defs>
        <SvgGradient id="recentTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={pink} />
          <Stop offset="50%" stopColor={mid} />
          <Stop offset="100%" stopColor={blue} />
        </SvgGradient>
      </Defs>
      <SvgText
        fill="url(#recentTitleGrad)"
        fontSize={28}
        fontWeight="800"
        x="0"
        y={28}
      >
        {word}
      </SvgText>
    </Svg>
  );
}

function FilterPill({
  label,
  icon,
  active,
  onPress,
  showOnlineDot,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  showOnlineDot?: boolean;
}) {
  const inner = (
    <View style={styles.filterInner}>
      {showOnlineDot ? (
        <View style={styles.filterOnlineDot} />
      ) : (
        <Ionicons name={icon} size={16} color={active ? '#fff' : colors.ink.secondary} />
      )}
      <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
    </View>
  );

  if (active) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, flex: 1 }]}>
        <LinearGradient
          colors={[...gradient.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.filterPillActive}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.filterPill, { opacity: pressed ? 0.85 : 1, flex: 1 }]}
    >
      {inner}
    </Pressable>
  );
}

function PlayerCard({
  item,
  onProfile,
  onPlay,
  onAdd,
  t,
}: {
  item: RecentPlayer;
  onProfile: () => void;
  onPlay: () => void;
  onAdd: () => void;
  t: (key: string) => string;
}) {
  const gameImage = getGameImage(item.gameId);
  const online = item.isOnline;

  return (
    <View style={styles.playerCard}>
      <View style={styles.playerMain}>
        <Pressable onPress={onProfile} style={styles.avatarWrap}>
          <Avatar uri={item.photoUrl} name={item.nickname} size={52} />
          <View
            style={[
              styles.statusDot,
              { backgroundColor: online ? '#00E676' : '#5C5C6A' },
            ]}
          />
        </Pressable>

        <Pressable onPress={onProfile} style={styles.playerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName} numberOfLines={1}>
              {item.nickname}
            </Text>
            <View style={[styles.statusBadge, online ? styles.badgeOnline : styles.badgeOffline]}>
              <Text style={[styles.badgeText, online ? styles.badgeTextOnline : styles.badgeTextOffline]}>
                {online ? t('recent.online') : t('recent.offline')}
              </Text>
            </View>
          </View>

          <View style={styles.gameRow}>
            {gameImage ? (
              <Image source={gameImage} style={styles.gameIcon} />
            ) : (
              <Ionicons name="game-controller" size={14} color={GAME_ACCENT} />
            )}
            <Text style={styles.gameName} numberOfLines={1}>
              {item.gameName}
            </Text>
          </View>

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={13} color={colors.ink.disabled} />
            <Text style={styles.timeText}>{formatPlayedAt(item.lastPlayedAt)}</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={onProfile} style={styles.actionBtn}>
          <Ionicons name="eye-outline" size={18} color={ACTION_COLORS.profile.icon} />
          <Text style={[styles.actionLabel, { color: ACTION_COLORS.profile.label }]}>
            {t('recent.actionProfile')}
          </Text>
        </Pressable>
        <Pressable onPress={onPlay} style={styles.actionBtn}>
          <Ionicons name="game-controller-outline" size={18} color={ACTION_COLORS.play.icon} />
          <Text style={[styles.actionLabel, { color: ACTION_COLORS.play.label }]}>
            {t('recent.actionPlay')}
          </Text>
        </Pressable>
        <Pressable onPress={onAdd} style={styles.actionBtn}>
          <Ionicons name="person-add-outline" size={18} color={ACTION_COLORS.add.icon} />
          <Text style={[styles.actionLabel, { color: ACTION_COLORS.add.label }]}>
            {t('recent.actionAdd')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function RecentPlayersScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const tabs = useMainTabs(navigation, 'matches');
  const tabBarHeight = useBottomTabBarHeight();
  const listBottomPad = tabBarHeight + CREATE_GROUP_DOCK_HEIGHT + 16;
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: players = [], refetch, isRefetching } = useQuery({
    queryKey: ['recent-players'],
    queryFn: fetchRecentPlayers,
  });

  const {
    data: invites = [],
    refetch: refetchInvites,
  } = useQuery({
    queryKey: ['group-invites', 'pending'],
    queryFn: fetchPendingGroupInvites,
  });

  useFocusEffect(
    React.useCallback(() => {
      void refetch();
      void refetchInvites();
    }, [refetch, refetchInvites]),
  );

  const filteredPlayers = useMemo(() => {
    if (filter === 'online') return players.filter((p) => p.isOnline);
    return players;
  }, [players, filter]);

  const onRefresh = () => {
    void refetch();
    void refetchInvites();
  };

  const onRespondInvite = async (inviteId: string, accept: boolean, groupId?: string) => {
    await respondGroupInvite(inviteId, accept);
    await qc.invalidateQueries({ queryKey: ['group-invites', 'pending'] });
    await qc.invalidateQueries({ queryKey: ['groups'] });
    if (accept && groupId) navigation.navigate('GroupDetail', { groupId });
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.filterRow}>
        <FilterPill
          label={t('recent.filterAll')}
          icon="people"
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterPill
          label={t('recent.filterOnline')}
          icon="ellipse"
          active={filter === 'online'}
          onPress={() => setFilter('online')}
          showOnlineDot
        />
        <FilterPill
          label={t('recent.filterInvitations')}
          icon="mail-outline"
          active={filter === 'invitations'}
          onPress={() => setFilter('invitations')}
        />
      </View>

      {filter !== 'invitations' ? (
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t('recent.sectionLabel')}</Text>
          <Text style={styles.sectionCount}>
            {t('recent.playerCount', { count: filteredPlayers.length })}
          </Text>
        </View>
      ) : (
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t('recent.invitationsSection')}</Text>
          <Text style={styles.sectionCount}>
            {t('recent.invitationCount', { count: invites.length })}
          </Text>
        </View>
      )}
    </View>
  );

  const showCreateGroupDock = filter !== 'invitations';

  return (
    <TeamScreenBackground style={styles.root}>
      <StatusBar style="light" backgroundColor={PURE_BLACK} />
      <SafeAreaView style={styles.page} edges={['top']}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() =>
                navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')
              }
              hitSlop={12}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
            <View style={styles.logoCenter}>
              <Logo size={28} showText />
            </View>
            <Pressable
              onPress={onRefresh}
              hitSlop={12}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="options-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.titlePrefix}>{t('recent.titlePrefix')} </Text>
              <GradientTitleWord word={t('recent.titleHighlight')} />
            </View>
            <Text style={styles.subtitle}>{t('recent.subtitle')}</Text>
          </View>

          {filter === 'invitations' ? (
            <FlatList
              data={invites}
              keyExtractor={(i) => i.id}
              ListHeaderComponent={listHeader}
              contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 24 }]}
              refreshing={isRefetching}
              onRefresh={onRefresh}
              renderItem={({ item }) => (
                <GroupInviteCard
                  invite={item}
                  onAccept={() => onRespondInvite(item.id, true, item.group.id)}
                  onDecline={() => onRespondInvite(item.id, false)}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>{t('recent.invitationsEmpty')}</Text>
              }
            />
          ) : (
            <FlatList
              data={filteredPlayers}
              keyExtractor={(p) => p.id}
              ListHeaderComponent={listHeader}
              contentContainerStyle={[
                styles.listContent,
                showCreateGroupDock && { paddingBottom: listBottomPad },
              ]}
              refreshing={isRefetching}
              onRefresh={onRefresh}
              renderItem={({ item }) => (
                <PlayerCard
                  item={item}
                  t={t}
                  onProfile={() => navigation.navigate('UserProfile', { userId: item.userId })}
                  onPlay={() => navigation.navigate('Home')}
                  onAdd={() =>
                    navigation.navigate('AddToGroup', {
                      userId: item.userId,
                      name: item.nickname,
                    })
                  }
                />
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {filter === 'online' ? t('recent.emptyOnline') : t('recent.empty')}
                </Text>
              }
            />
          )}
      </SafeAreaView>

      {showCreateGroupDock ? (
        <View
          style={[styles.createGroupDock, { bottom: tabBarHeight + 22 }]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => navigation.navigate('CreateGroup')}
            style={({ pressed }) => [styles.createGroupCard, { opacity: pressed ? 0.92 : 1 }]}
          >
            <View style={styles.createGroupIconBox}>
              <Ionicons name="people" size={22} color={colors.brand.purple} />
            </View>
            <View style={styles.createGroupText}>
              <Text style={styles.createGroupTitle}>{t('recent.createGroupBannerTitle')}</Text>
              <Text style={styles.createGroupBody}>{t('recent.createGroupBannerBody')}</Text>
            </View>
            <LinearGradient
              colors={[colors.brand.purple, colors.brand.blue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createGroupBtn}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.createGroupBtnText}>{t('recent.createGroup')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}

      <BottomTabBar active="matches" tabs={tabs} />
    </TeamScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  logoCenter: {
    flex: 1,
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  titlePrefix: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.ink.secondary,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    borderRadius: 14,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  filterPillActive: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  filterInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  filterLabel: {
    color: colors.ink.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  filterOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  listHeader: {
    paddingBottom: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    color: colors.ink.disabled,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionCount: {
    color: colors.brand.purple,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  createGroupDock: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 10,
  },
  playerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    marginRight: 6,
  },
  avatarWrap: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: CARD_BG,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeOnline: {
    borderColor: 'rgba(0, 230, 118, 0.45)',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  badgeOffline: {
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextOnline: {
    color: '#00E676',
  },
  badgeTextOffline: {
    color: colors.ink.disabled,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  gameIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  gameName: {
    color: GAME_ACCENT,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    color: colors.ink.disabled,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: 2,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 5,
    minWidth: 44,
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  createGroupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(123, 63, 242, 0.35)',
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  createGroupIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(123, 63, 242, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createGroupText: {
    flex: 1,
    minWidth: 0,
  },
  createGroupTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  createGroupBody: {
    color: colors.ink.secondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createGroupBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  empty: {
    color: colors.ink.secondary,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
});
