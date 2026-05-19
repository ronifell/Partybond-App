import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BottomTabBar, useBottomTabBarHeight } from '../components/BottomTabBar';
import { GroupInviteCard } from '../components/GroupInviteCard';
import { Avatar } from '../components/ui/Avatar';
import { useMainTabs } from '../hooks/useMainTabs';
import { useAuth } from '../store/authStore';
import {
  fetchConversations,
  fetchPendingGroupInvites,
  fetchRecentPlayers,
  openDirectChat,
  respondGroupInvite,
} from '../api/social';
import type { ConversationSummary } from '../api/types';
import { colors, gradient } from '../theme/tokens';

const PURE_BLACK = '#000000';
const CARD_BG = '#12121A';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const INPUT_BG = '#14141C';

type MessagesTab = 'all' | 'groups' | 'squads' | 'requests';

function formatRelativeTime(iso: string, t: (key: string, opts?: Record<string, unknown>) => string) {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return t('chats.timeJustNow');
  if (diffMin < 60) return t('chats.timeMinutes', { count: diffMin });
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return t('chats.timeHours', { count: diffH });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  ) {
    return t('chats.timeYesterday');
  }
  return d.toLocaleDateString();
}

function ConversationRow({
  item,
  userId,
  onPress,
  t,
}: {
  item: ConversationSummary;
  userId: string | undefined;
  onPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const title = item.title ?? item.peer?.name ?? t('chats.unnamed');
  const photo = item.photoUrl ?? item.peer?.photoUrl;
  const last = item.lastMessage;
  const isMine = last?.senderId === userId;
  const timeLabel = last ? formatRelativeTime(last.createdAt, t) : '';

  let previewPrefix = '';
  if (last) {
    if (isMine) previewPrefix = t('chats.youPrefix');
    else if (item.type === 'group' && last.senderName) previewPrefix = `${last.senderName}: `;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.convCard, { opacity: pressed ? 0.92 : 1 }]}
    >
      <View style={styles.convAvatarWrap}>
        <Avatar uri={photo} name={title} size={52} glow={false} />
        <View style={styles.convOnlineDot} />
      </View>

      <View style={styles.convBody}>
        <View style={styles.convTopRow}>
          <Text style={styles.convTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.convMetaRight}>
            {item.isPinned ? (
              <Ionicons name="pin" size={14} color={colors.ink.disabled} style={{ marginRight: 6 }} />
            ) : null}
            {isMine && last ? (
              <Ionicons name="checkmark-done" size={16} color={colors.brand.purple} />
            ) : null}
          </View>
        </View>

        {last ? (
          <Text style={styles.convPreview} numberOfLines={2}>
            {previewPrefix ? <Text style={styles.convPreviewAccent}>{previewPrefix}</Text> : null}
            {last.body}
          </Text>
        ) : (
          <Text style={styles.convPreviewMuted}>{t('chats.noMessagesYet')}</Text>
        )}

        <Text style={styles.convTime}>{timeLabel}</Text>
      </View>

      {item.unreadCount > 0 ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>
            {item.unreadCount > 99 ? '99+' : item.unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ChatsScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const tabs = useMainTabs(navigation, 'messages');
  const tabBarHeight = useBottomTabBarHeight();
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<MessagesTab>('all');
  const [search, setSearch] = useState('');
  const [storyFilter, setStoryFilter] = useState<string | null>(null);

  const { data: conversations = [], refetch, isRefetching } = useQuery({
    queryKey: ['chats'],
    queryFn: fetchConversations,
  });

  const { data: recentPlayers = [] } = useQuery({
    queryKey: ['recent-players'],
    queryFn: fetchRecentPlayers,
  });

  const { data: invites = [], refetch: refetchInvites } = useQuery({
    queryKey: ['group-invites', 'pending'],
    queryFn: fetchPendingGroupInvites,
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
      void refetchInvites();
    }, [refetch, refetchInvites]),
  );

  const counts = useMemo(() => {
    const all = conversations.length;
    const groups = conversations.filter((c) => c.type === 'group').length;
    const squads = conversations.filter((c) => c.type === 'direct').length;
    const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
    return { all, groups, squads, requests: invites.length, totalUnread };
  }, [conversations, invites]);

  const filtered = useMemo(() => {
    let list = conversations;
    if (activeTab === 'groups') list = list.filter((c) => c.type === 'group');
    if (activeTab === 'squads') list = list.filter((c) => c.type === 'direct');
    if (storyFilter) {
      if (storyFilter === 'all') {
        /* no filter */
      } else {
        list = list.filter(
          (c) =>
            c.peer?.id === storyFilter ||
            c.participants.some((p) => p.id === storyFilter),
        );
      }
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const title = (c.title ?? c.peer?.name ?? '').toLowerCase();
        const body = c.lastMessage?.body.toLowerCase() ?? '';
        return title.includes(q) || body.includes(q);
      });
    }
    return list;
  }, [conversations, activeTab, search, storyFilter]);

  const openConversation = (item: ConversationSummary) => {
    navigation.navigate('Chat', {
      conversationId: item.id,
      title: item.title ?? item.peer?.name,
      groupId: item.groupId ?? undefined,
      type: item.type,
    });
  };

  const onOpenRecent = async (userId: string, name: string) => {
    const conv = await openDirectChat(userId);
    await qc.invalidateQueries({ queryKey: ['chats'] });
    navigation.navigate('Chat', {
      conversationId: conv.id,
      title: name,
      type: 'direct',
    });
  };

  const onRespondInvite = async (inviteId: string, accept: boolean, groupId?: string) => {
    const result = await respondGroupInvite(inviteId, accept);
    await qc.invalidateQueries({ queryKey: ['group-invites', 'pending'] });
    await qc.invalidateQueries({ queryKey: ['groups'] });
    await qc.invalidateQueries({ queryKey: ['chats'] });
    if (accept) {
      const id = groupId ?? (result as { groupId?: string }).groupId;
      if (id) navigation.navigate('GroupDetail', { groupId: id });
    }
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.pageTitle}>{t('chats.title')}</Text>
          <Text style={styles.pageSubtitle}>{t('chats.subtitle')}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('RecentPlayers')}
          style={({ pressed }) => [styles.composeBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={[...gradient.primary]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons name="create-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.ink.disabled} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('chats.searchPlaceholder')}
            placeholderTextColor={colors.ink.disabled}
            style={styles.searchInput}
          />
        </View>
        <Pressable
          onPress={() => Alert.alert(t('chats.filter'), t('chats.filterSoon'))}
          style={styles.filterBtn}
        >
          <Ionicons name="options-outline" size={20} color={colors.ink.secondary} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesScroll}
      >
        <Pressable
          onPress={() => setStoryFilter(storyFilter === 'all' ? null : 'all')}
          style={styles.storyItem}
        >
          <View style={[styles.storyRing, storyFilter === 'all' && styles.storyRingActive]}>
            <LinearGradient
              colors={['rgba(123,63,242,0.35)', 'rgba(255,77,166,0.25)']}
              style={styles.storyAllInner}
            >
              <Ionicons name="people" size={26} color={colors.brand.purple} />
            </LinearGradient>
            {counts.totalUnread > 0 ? (
              <View style={styles.storyBadge}>
                <Text style={styles.storyBadgeText}>
                  {counts.totalUnread > 99 ? '99+' : counts.totalUnread}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.storyLabel}>{t('chats.storyAll')}</Text>
        </Pressable>

        {recentPlayers.slice(0, 8).map((p) => (
          <Pressable
            key={p.userId}
            onLongPress={() => void onOpenRecent(p.userId, p.nickname)}
            onPress={() => setStoryFilter(storyFilter === p.userId ? null : p.userId)}
            style={styles.storyItem}
          >
            <View
              style={[
                styles.storyRing,
                storyFilter === p.userId && styles.storyRingActive,
              ]}
            >
              <Avatar uri={p.photoUrl} name={p.nickname} size={56} glow={false} />
              {p.isOnline ? <View style={styles.storyOnline} /> : null}
            </View>
            <Text style={styles.storyLabel} numberOfLines={1}>
              {p.nickname}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {(
          [
            { key: 'all' as const, label: t('chats.tabAll'), count: counts.all },
            { key: 'groups' as const, label: t('chats.tabGroups'), count: counts.groups },
            { key: 'squads' as const, label: t('chats.tabSquads'), count: counts.squads },
            {
              key: 'requests' as const,
              label: t('chats.tabRequests'),
              count: counts.requests,
            },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={styles.tabItem}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              {tab.count > 0 ? (
                <View style={[styles.tabCount, active && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              ) : null}
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

  const renderBody = () => {
    if (activeTab === 'requests') {
      if (invites.length === 0) {
        return <Text style={styles.empty}>{t('chats.requestsEmpty')}</Text>;
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

    if (filtered.length === 0) {
      return <Text style={styles.empty}>{t('chats.empty')}</Text>;
    }

    return filtered.map((item) => (
      <ConversationRow
        key={item.id}
        item={item}
        userId={user?.id}
        onPress={() => openConversation(item)}
        t={t}
      />
    ));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor={PURE_BLACK} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <FlatList
          data={[{ key: 'main' }]}
          keyExtractor={(i) => i.key}
          ListHeaderComponent={listHeader}
          renderItem={() => <View style={styles.listBody}>{renderBody()}</View>}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 12 }}
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
            void refetchInvites();
          }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
      <BottomTabBar active="messages" tabs={tabs} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PURE_BLACK,
  },
  safe: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: colors.ink.secondary,
    fontSize: 13,
    marginTop: 4,
  },
  composeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(123,63,242,0.45)',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 8,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storiesScroll: {
    gap: 14,
    paddingBottom: 14,
    paddingRight: 8,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyRing: {
    padding: 3,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  storyRingActive: {
    borderColor: colors.brand.purple,
    shadowColor: colors.brand.purple,
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  storyAllInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.purple,
    borderWidth: 2,
    borderColor: PURE_BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: colors.brand.purple,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  storyBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  storyOnline: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00E676',
    borderWidth: 2,
    borderColor: PURE_BLACK,
  },
  storyLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 68,
  },
  tabsScroll: {
    gap: 18,
    paddingBottom: 12,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  tabCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabCountActive: {
    backgroundColor: 'rgba(123,63,242,0.35)',
  },
  tabCountText: {
    color: colors.ink.disabled,
    fontSize: 11,
    fontWeight: '800',
  },
  tabCountTextActive: {
    color: colors.brand.purple,
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
    gap: 10,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 12,
    gap: 12,
  },
  convAvatarWrap: {
    position: 'relative',
  },
  convOnlineDot: {
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
  convBody: {
    flex: 1,
    minWidth: 0,
  },
  convTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  convTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  convMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  convPreview: {
    color: colors.ink.secondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  convPreviewAccent: {
    color: colors.brand.purple,
    fontWeight: '700',
  },
  convPreviewMuted: {
    color: colors.ink.disabled,
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  convTime: {
    color: colors.ink.disabled,
    fontSize: 11,
    marginTop: 4,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand.purple,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    shadowColor: colors.brand.purple,
    shadowOpacity: 0.65,
    shadowRadius: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  empty: {
    color: colors.ink.secondary,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
  },
});
