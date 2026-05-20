import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Avatar } from '../components/ui/Avatar';
import {
  createGroupSchedule,
  fetchGroup,
  fetchMessages,
  markChatRead,
  sendChatMessage,
  setSessionRsvp,
} from '../api/social';
import { getApiError } from '../api/client';
import { useNotificationStore } from '../store/notificationStore';
import { fetchGames } from '../api/games';
import { getSocket } from '../socket';
import { getGameImage } from '../theme/assets';
import { colors } from '../theme/tokens';
import { useAuth } from '../store/authStore';
import type { ChatMessage } from '../api/types';

const PURE_BLACK = '#000000';
const CARD_BG = '#0D0D12';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const BUBBLE_IN = '#16161E';
const BUBBLE_OUT = 'rgba(123,63,242,0.45)';

type ChatTab = 'chat' | 'members' | 'schedule' | 'info';
type ListRow =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'message'; id: string; message: ChatMessage };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatPinnedMeta(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dayLabel(iso: string, t: (k: string) => string) {
  const d = new Date(iso);
  const now = new Date();
  const same =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (same) return t('groupChat.today');
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return t('groupChat.yesterday');
  return d.toLocaleDateString();
}

function buildMessageRows(messages: ChatMessage[], t: (k: string) => string): ListRow[] {
  const rows: ListRow[] = [];
  let lastDay = '';
  for (const m of messages) {
    const day = dayLabel(m.createdAt, t);
    if (day !== lastDay) {
      rows.push({ kind: 'date', id: `d-${m.createdAt}`, label: day });
      lastDay = day;
    }
    rows.push({ kind: 'message', id: m.id, message: m });
  }
  return rows;
}

export function ChatScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const showTopToast = useNotificationStore((s) => s.showTopToast);
  const qc = useQueryClient();
  const {
    conversationId,
    title,
    groupId,
    type,
  } = route.params as {
    conversationId: string;
    title?: string;
    groupId?: string;
    type?: 'direct' | 'group';
  };

  const isGroup = type === 'group' || !!groupId;
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<ChatTab>('chat');
  const [pinnedOpen, setPinnedOpen] = useState(true);

  const { data } = useQuery({
    queryKey: ['chat', conversationId],
    queryFn: () => fetchMessages(conversationId),
  });

  const { data: group, refetch: refetchGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => fetchGroup(groupId!),
    enabled: !!groupId,
  });

  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });

  const gameName = useMemo(() => {
    const id = user?.selectedGame;
    return games.find((g) => g.id === id)?.name ?? '';
  }, [games, user?.selectedGame]);

  const roleByUserId = useMemo(() => {
    const map = new Map<string, string>();
    group?.members.forEach((m) => map.set(m.id, m.role));
    return map;
  }, [group?.members]);

  const onlineCount = group?.members.filter((m) => m.isOnline).length ?? 0;
  const isGroupCreator = !!user && !!group && group.createdById === user.id;

  const myRsvpStatus = useMemo(() => {
    if (!group?.nextSession || !user) return null;
    return group.nextSession.rsvps.find((r) => r.userId === user.id)?.status ?? null;
  }, [group?.nextSession, user]);

  const messages = data?.messages ?? [];
  const rows = useMemo(() => buildMessageRows(messages, t), [messages, t]);
  const pinned = data?.pinned?.[0];

  useEffect(() => {
    void markChatRead(conversationId);
    const socket = getSocket();
    if (!socket) return;
    const onMessage = () => {
      void qc.invalidateQueries({ queryKey: ['chat', conversationId] });
    };
    socket.on('chat:message', onMessage);
    socket.on('chat:read', onMessage);
    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:read', onMessage);
    };
  }, [conversationId, qc]);

  const onSend = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    await sendChatMessage(conversationId, body);
    await qc.invalidateQueries({ queryKey: ['chat', conversationId] });
    await qc.invalidateQueries({ queryKey: ['chats'] });
  };

  const onSchedule = async () => {
    if (!groupId) return;
    if (!isGroupCreator) {
      Alert.alert(t('groups.scheduleLeaderOnlyTitle'), t('groups.scheduleLeaderOnlyBody'));
      return;
    }
    try {
      const d = new Date();
      const day = d.getDay();
      await createGroupSchedule(groupId, { dayOfWeek: day === 0 ? 2 : day, timeLocal: '21:00' });
      await refetchGroup();
      showTopToast(t('groupDetail.scheduleDone'));
    } catch (err) {
      const apiErr = getApiError(err);
      Alert.alert(t('groups.scheduleFailedTitle'), apiErr.message || t('groups.scheduleFailedBody'));
    }
  };

  const onRsvp = async (status: 'confirmed' | 'declined') => {
    if (!group?.nextSession) return;
    try {
      await setSessionRsvp(group.nextSession.id, status);
      await refetchGroup();
      showTopToast(
        status === 'confirmed' ? t('groups.rsvpConfirmedSelf') : t('groups.rsvpDeclinedSelf'),
      );
    } catch (err) {
      const apiErr = getApiError(err);
      Alert.alert(t('groups.rsvpFailedTitle'), apiErr.message || t('groups.rsvpFailedBody'));
    }
  };

  const displayTitle = title ?? group?.name ?? t('chats.unnamed');
  const groupPhoto =
    group?.photoUrl ?? group?.members.find((m) => m.role === 'admin')?.photoUrl ?? null;

  if (!isGroup) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" backgroundColor={PURE_BLACK} />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.dmHeader}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.dmTitle}>{displayTitle}</Text>
          </View>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={80}
          >
            <FlatList
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={{ padding: 16, gap: 8 }}
              renderItem={({ item }) => {
                const mine = item.senderId === user?.id;
                return (
                  <View
                    style={[
                      styles.dmBubble,
                      mine ? styles.dmBubbleMine : styles.dmBubbleTheirs,
                    ]}
                  >
                    <Text style={styles.dmBubbleText}>{item.body}</Text>
                  </View>
                );
              }}
            />
            <View style={styles.dmInputRow}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t('chats.placeholder')}
                placeholderTextColor={colors.ink.disabled}
                style={styles.dmInput}
              />
              <Pressable onPress={onSend} style={styles.dmSend}>
                <Text style={styles.dmSendText}>{t('chats.send')}</Text>
              </Pressable>
            </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
    );
  }

  const renderMessage = (item: ChatMessage) => {
    const mine = item.senderId === user?.id;
    const role = roleByUserId.get(item.senderId);
    const isAdmin = role === 'admin';

    if (mine) {
      return (
        <View style={styles.msgRowOut}>
          <View style={styles.msgOutCol}>
            <View style={styles.bubbleOut}>
              <Text style={styles.bubbleText}>{item.body}</Text>
              <View style={styles.bubbleMetaOut}>
                <Text style={styles.bubbleTime}>{formatTime(item.createdAt)}</Text>
                <Ionicons name="checkmark-done" size={14} color={colors.brand.blue} />
              </View>
            </View>
          </View>
          <Avatar uri={item.sender.photoUrl} name={item.sender.name} size={36} glow />
        </View>
      );
    }

    return (
      <View style={styles.msgRowIn}>
        <View style={styles.msgAvatarCol}>
          <Avatar uri={item.sender.photoUrl} name={item.sender.name} size={36} glow={false} />
          <View style={styles.msgOnlineDot} />
        </View>
        <View style={styles.msgInCol}>
          <View style={styles.msgNameRow}>
            <Text style={styles.msgSender}>{item.sender.name}</Text>
            <View style={[styles.roleBadge, isAdmin ? styles.roleAdmin : styles.roleMember]}>
              <Text style={[styles.roleText, isAdmin ? styles.roleTextAdmin : styles.roleTextMember]}>
                {isAdmin ? t('groupChat.roleAdmin') : t('groupChat.roleMember')}
              </Text>
            </View>
          </View>
          <View style={styles.bubbleIn}>
            <Text style={styles.bubbleText}>{item.body}</Text>
            <Text style={styles.bubbleTimeIn}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const tabContent = () => {
    if (activeTab === 'members' && group) {
      return (
        <View style={styles.tabPanel}>
          {group.members.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => navigation.navigate('UserProfile', { userId: m.id })}
              style={styles.memberRow}
            >
              <Avatar uri={m.photoUrl} name={m.name} size={44} />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.name}</Text>
                <Text style={m.isOnline ? styles.memberOnline : styles.memberOffline}>
                  {m.isOnline ? t('recent.online') : t('recent.offline')}
                </Text>
              </View>
              {m.role === 'admin' ? (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleTextAdmin}>{t('groupChat.roleAdmin')}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      );
    }

    if (activeTab === 'schedule' && group) {
      return (
        <View style={styles.tabPanel}>
          {group.nextSession ? (
            <View style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>{t('groups.nextSession')}</Text>
              <Text style={styles.sessionTime}>
                {new Date(group.nextSession.startsAt).toLocaleString()}
              </Text>
              <View style={styles.sessionActions}>
                <Pressable
                  onPress={() => void onRsvp('confirmed')}
                  style={[
                    styles.sessionRsvpBtn,
                    myRsvpStatus === 'confirmed' && styles.sessionRsvpBtnActive,
                  ]}
                >
                  <Text style={styles.sessionRsvpText}>{t('groups.confirm')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => void onRsvp('declined')}
                  style={[
                    styles.sessionRsvpBtnOutline,
                    myRsvpStatus === 'declined' && styles.sessionRsvpBtnDeclinedActive,
                  ]}
                >
                  <Text style={styles.sessionRsvpTextOutline}>{t('groups.decline')}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {group.schedules.length === 0 ? (
            <Text style={styles.tabEmpty}>{t('groupChat.noSchedule')}</Text>
          ) : (
            group.schedules.map((s) => (
              <View key={s.id} style={styles.scheduleRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.brand.purple} />
                <Text style={styles.scheduleText}>
                  {t('groupDetail.scheduleLine', {
                    day: s.dayOfWeek,
                    time: s.timeLocal,
                    frequency: s.frequency,
                  })}
                </Text>
              </View>
            ))
          )}
          {isGroupCreator ? (
            <Pressable onPress={() => void onSchedule()} style={styles.scheduleAddBtn}>
              <Text style={styles.scheduleAddText}>{t('groups.schedule')}</Text>
            </Pressable>
          ) : null}
        </View>
      );
    }

    if (activeTab === 'info' && group) {
      return (
        <View style={styles.tabPanel}>
          <Text style={styles.infoTitle}>{group.name}</Text>
          <Text style={styles.infoMeta}>
            {t('groupDetail.createdOn', {
              date: new Date(group.createdAt).toLocaleDateString(),
            })}
          </Text>
          <Text style={styles.infoMeta}>{t('groupDetail.memberCount', { count: group.members.length })}</Text>
          {gameName ? <Text style={styles.infoGame}>{gameName}</Text> : null}
          <Pressable
            onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
            style={styles.infoLinkBtn}
          >
            <Text style={styles.infoLinkText}>{t('groupChat.viewGroupPage')}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList
        style={{ flex: 1 }}
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.chatList}
        renderItem={({ item }) => {
          if (item.kind === 'date') {
            return (
              <View style={styles.datePillWrap}>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>{item.label}</Text>
                </View>
              </View>
            );
          }
          return renderMessage(item.message);
        }}
        ListHeaderComponent={
          pinned && pinnedOpen ? (
            <Pressable
              onPress={() => setPinnedOpen((o) => !o)}
              style={styles.pinnedCard}
            >
              <View style={styles.pinnedHead}>
                <Ionicons name="pin" size={16} color={colors.brand.purple} />
                <Text style={styles.pinnedTitle}>{t('groupChat.pinnedTitle')}</Text>
                <Ionicons
                  name={pinnedOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.ink.secondary}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
              <Text style={styles.pinnedBody}>{pinned.body}</Text>
              <Text style={styles.pinnedMeta}>
                {t('groupChat.pinnedMeta', { date: formatPinnedMeta(pinned.pinnedAt) })}
              </Text>
            </Pressable>
          ) : pinned && !pinnedOpen ? (
            <Pressable onPress={() => setPinnedOpen(true)} style={styles.pinnedCollapsed}>
              <Ionicons name="pin" size={14} color={colors.brand.purple} />
              <Text style={styles.pinnedCollapsedText} numberOfLines={1}>
                {pinned.body}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.ink.secondary} />
            </Pressable>
          ) : null
        }
      />
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor={PURE_BLACK} />

      <LinearGradient
        colors={['rgba(30,10,50,0.55)', 'rgba(10,5,20,0.35)', 'transparent']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.topActions}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <View style={styles.topActionsRight}>
              <Pressable
                onPress={() => Alert.alert(t('groupChat.call'), t('groupChat.comingSoon'))}
                style={styles.iconBtn}
              >
                <Ionicons name="call-outline" size={18} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert(t('groupChat.more'), undefined, [
                    { text: t('groupChat.viewGroupPage'), onPress: () => groupId && navigation.navigate('GroupDetail', { groupId }) },
                    { text: t('common.cancel'), style: 'cancel' },
                  ])
                }
                style={styles.iconBtn}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View style={styles.teamHero}>
            <Pressable
              onPress={() => Alert.alert(t('groupDetail.editPhoto'), t('groupDetail.editPhotoSoon'))}
              style={styles.teamAvatarWrap}
            >
              <Avatar uri={groupPhoto} name={displayTitle} size={64} />
              <View style={styles.teamCamBtn}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </Pressable>
            <View style={styles.teamHeroText}>
              <View style={styles.teamNameRow}>
                <Text style={styles.teamName}>{displayTitle}</Text>
                <Pressable hitSlop={8}>
                  <Ionicons name="pencil" size={14} color={colors.ink.secondary} />
                </Pressable>
              </View>
              {gameName ? (
                <View style={styles.teamMetaRow}>
                  {user?.selectedGame && getGameImage(user.selectedGame) ? (
                    <Image source={getGameImage(user.selectedGame)!} style={styles.teamGameIcon} />
                  ) : (
                    <Ionicons name="game-controller" size={13} color={colors.brand.blue} />
                  )}
                  <Text style={styles.teamGame}>{gameName}</Text>
                  <View style={styles.teamOnlineDot} />
                  <Text style={styles.teamOnline}>
                    {t('groupChat.membersOnline', { count: onlineCount })}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.teamTagline}>{t('groupChat.defaultTagline')}</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            {(
              [
                { key: 'chat' as const, icon: 'chatbubble', label: t('groupChat.tabChat') },
                {
                  key: 'members' as const,
                  icon: 'people',
                  label: t('groupChat.tabMembers', { count: group?.members.length ?? 0 }),
                },
                { key: 'schedule' as const, icon: 'calendar', label: t('groupChat.tabSchedule') },
                { key: 'info' as const, icon: 'information-circle', label: t('groupChat.tabInfo') },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={styles.tabBtn}>
                  <Ionicons
                    name={tab.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={active ? colors.brand.purple : colors.ink.disabled}
                  />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
                  {active ? <View style={styles.tabUnderline} /> : null}
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1 }}>{tabContent()}</View>

        {activeTab === 'chat' ? (
          <>
            <View style={styles.inputBar}>
              <Pressable style={styles.attachBtn}>
                <Ionicons name="add" size={22} color={colors.brand.purple} />
              </Pressable>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t('groupChat.inputPlaceholder')}
                placeholderTextColor={colors.ink.disabled}
                style={styles.chatInput}
                multiline
                onSubmitEditing={onSend}
                blurOnSubmit={false}
              />
              <Pressable hitSlop={8}>
                <Ionicons name="happy-outline" size={22} color={colors.ink.secondary} />
              </Pressable>
              <Pressable hitSlop={8} style={{ marginLeft: 6 }} onPress={text.trim() ? onSend : undefined}>
                <Ionicons
                  name={text.trim() ? 'send' : 'mic-outline'}
                  size={22}
                  color={text.trim() ? colors.brand.purple : colors.ink.secondary}
                />
              </Pressable>
            </View>

            <View style={[styles.quickActions, { paddingBottom: Math.max(insets.bottom, 8) }]}>
              <Pressable
                onPress={() => navigation.navigate('Home')}
                style={({ pressed }) => [styles.quickBtn, styles.quickPurple, { opacity: pressed ? 0.88 : 1 }]}
              >
                <Ionicons name="game-controller-outline" size={20} color={colors.brand.purple} />
                <Text style={styles.quickBtnText}>{t('groupChat.invitePlay')}</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('RecentPlayers')}
                style={({ pressed }) => [styles.quickBtn, styles.quickBlue, { opacity: pressed ? 0.88 : 1 }]}
              >
                <Ionicons name="person-add-outline" size={20} color={colors.brand.blue} />
                <Text style={styles.quickBtnText}>{t('groupChat.inviteGroup')}</Text>
              </Pressable>
              {isGroupCreator ? (
                <Pressable
                  onPress={() => void onSchedule()}
                  style={({ pressed }) => [styles.quickBtn, styles.quickPink, { opacity: pressed ? 0.88 : 1 }]}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.brand.pink} />
                  <Text style={styles.quickBtnText}>{t('groupChat.scheduleMatch')}</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() =>
                  Alert.alert(t('groupChat.more'), undefined, [
                    { text: t('groups.completeSquad'), onPress: () => groupId && navigation.navigate('GroupDetail', { groupId }) },
                    { text: t('common.cancel'), style: 'cancel' },
                  ])
                }
                style={({ pressed }) => [styles.quickBtn, styles.quickGrey, { opacity: pressed ? 0.88 : 1 }]}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.ink.secondary} />
                <Text style={styles.quickBtnText}>{t('groupChat.more')}</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PURE_BLACK,
  },
  headerGradient: {
    paddingBottom: 0,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  topActionsRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamHero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 14,
  },
  teamAvatarWrap: {
    position: 'relative',
  },
  teamCamBtn: {
    position: 'absolute',
    right: -2,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A1A24',
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamHeroText: {
    flex: 1,
    minWidth: 0,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  teamMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  teamGameIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  teamGame: {
    color: colors.brand.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  teamOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
    marginLeft: 4,
  },
  teamOnline: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '600',
  },
  teamTagline: {
    color: colors.ink.secondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: CARD_BORDER,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
    position: 'relative',
  },
  tabLabel: {
    color: colors.ink.disabled,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.brand.purple,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: colors.brand.purple,
    borderRadius: 1,
  },
  chatList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
  },
  pinnedCard: {
    backgroundColor: 'rgba(123,63,242,0.18)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(123,63,242,0.4)',
    padding: 12,
    marginBottom: 12,
  },
  pinnedHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  pinnedTitle: {
    color: colors.brand.purple,
    fontWeight: '800',
    fontSize: 13,
  },
  pinnedBody: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  pinnedMeta: {
    color: colors.ink.disabled,
    fontSize: 11,
    marginTop: 6,
  },
  pinnedCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: CARD_BG,
    borderRadius: 10,
  },
  pinnedCollapsedText: {
    flex: 1,
    color: colors.ink.secondary,
    fontSize: 12,
  },
  datePillWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  datePill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  datePillText: {
    color: colors.ink.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  msgRowIn: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  msgRowOut: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  msgAvatarCol: {
    position: 'relative',
  },
  msgOnlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00E676',
    borderWidth: 2,
    borderColor: PURE_BLACK,
  },
  msgInCol: {
    flex: 1,
    maxWidth: '78%',
  },
  msgOutCol: {
    maxWidth: '78%',
  },
  msgNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  msgSender: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleAdmin: {
    backgroundColor: 'rgba(123,63,242,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(123,63,242,0.5)',
  },
  roleMember: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
  },
  roleTextAdmin: {
    color: colors.brand.purple,
    fontSize: 9,
    fontWeight: '800',
  },
  roleTextMember: {
    color: colors.ink.disabled,
    fontSize: 9,
    fontWeight: '800',
  },
  bubbleIn: {
    backgroundColor: BUBBLE_IN,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  bubbleOut: {
    backgroundColor: BUBBLE_OUT,
    borderRadius: 14,
    borderTopRightRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(123,63,242,0.35)',
  },
  bubbleText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTime: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    marginRight: 4,
  },
  bubbleTimeIn: {
    color: colors.ink.disabled,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  bubbleMetaOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    gap: 6,
  },
  attachBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.brand.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: CARD_BG,
    gap: 6,
  },
  quickPurple: { borderColor: 'rgba(123,63,242,0.55)' },
  quickBlue: { borderColor: 'rgba(0,209,255,0.45)' },
  quickPink: { borderColor: 'rgba(255,77,166,0.45)' },
  quickGrey: { borderColor: CARD_BORDER },
  quickBtnText: {
    color: colors.ink.secondary,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 11,
  },
  tabPanel: {
    padding: 16,
    gap: 10,
  },
  tabEmpty: {
    color: colors.ink.secondary,
    textAlign: 'center',
    marginTop: 24,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  memberInfo: { flex: 1 },
  memberName: { color: '#fff', fontWeight: '800', fontSize: 15 },
  memberOnline: { color: '#00E676', fontSize: 12, marginTop: 2 },
  memberOffline: { color: colors.ink.disabled, fontSize: 12, marginTop: 2 },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  scheduleText: { color: '#fff', flex: 1, fontSize: 14 },
  scheduleAddBtn: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(123,63,242,0.2)',
    alignItems: 'center',
  },
  scheduleAddText: { color: colors.brand.purple, fontWeight: '800' },
  sessionCard: {
    backgroundColor: 'rgba(123,63,242,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(123,63,242,0.35)',
    padding: 14,
    marginBottom: 8,
  },
  sessionTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  sessionTime: { color: colors.ink.secondary, marginTop: 4, fontSize: 13 },
  sessionActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sessionRsvpBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.brand.purple,
    alignItems: 'center',
  },
  sessionRsvpBtnActive: { borderWidth: 2, borderColor: '#fff' },
  sessionRsvpBtnOutline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
  },
  sessionRsvpBtnDeclinedActive: {
    borderColor: colors.brand.pink,
    backgroundColor: 'rgba(255,77,166,0.15)',
  },
  sessionRsvpText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sessionRsvpTextOutline: { color: colors.ink.secondary, fontWeight: '700', fontSize: 13 },
  infoTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  infoMeta: { color: colors.ink.secondary, fontSize: 13, marginTop: 6 },
  infoGame: { color: colors.brand.blue, fontSize: 14, fontWeight: '700', marginTop: 8 },
  infoLinkBtn: { marginTop: 16 },
  infoLinkText: { color: colors.brand.purple, fontWeight: '800' },
  dmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  dmTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  dmBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
  },
  dmBubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: BUBBLE_OUT,
  },
  dmBubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: BUBBLE_IN,
  },
  dmBubbleText: { color: '#fff' },
  dmInputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: CARD_BORDER,
  },
  dmInput: {
    flex: 1,
    color: '#fff',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dmSend: {
    backgroundColor: colors.brand.purple,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  dmSendText: { color: '#fff', fontWeight: '800' },
});
