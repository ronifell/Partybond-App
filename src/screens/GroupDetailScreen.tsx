import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Alert,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Avatar } from '../components/ui/Avatar';
import { HexagonFrame, HexagonSuccessBadge } from '../components/ui/HexagonFrame';
import { GradientButton } from '../components/ui/GradientButton';
import { TeamScreenBackground } from '../components/ui/TeamScreenBackground';
import { GroupNextSessionCard } from '../components/GroupNextSessionCard';
import {
  createGroupSchedule,
  fetchGroup,
  fetchSquadFillSuggestions,
  inviteSquadFill,
  setSessionRsvp,
} from '../api/social';
import { fetchGames } from '../api/games';
import { getApiError } from '../api/client';
import { useAuth } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { getGameImage } from '../theme/assets';
import { colors, gradient } from '../theme/tokens';

const PURE_BLACK = '#000000';
const CARD_BG = '#0D0D12';
const CARD_BORDER = 'rgba(255,255,255,0.08)';

function GradientTitle({ text }: { text: string }) {
  const [pink, mid, blue] = gradient.primary;
  const width = Math.min(text.length * 14 + 24, 320);
  return (
    <Svg height={36} width={width}>
      <Defs>
        <SvgGradient id="groupTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={pink} />
          <Stop offset="50%" stopColor={mid} />
          <Stop offset="100%" stopColor={blue} />
        </SvgGradient>
      </Defs>
      <SvgText fill="url(#groupTitleGrad)" fontSize={26} fontWeight="800" x="0" y={30}>
        {text}
      </SvgText>
    </Svg>
  );
}

export function GroupDetailScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const showTopToast = useNotificationStore((s) => s.showTopToast);
  const qc = useQueryClient();
  const { groupId, justCreated } = route.params as { groupId: string; justCreated?: boolean };
  const [suggestions, setSuggestions] = useState<
    Array<{ userId: string; name: string; photoUrl?: string | null }>
  >([]);
  const [squadModalOpen, setSquadModalOpen] = useState(false);
  const [memberMenuId, setMemberMenuId] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(21, 0, 0, 0);
    return date;
  });
  const [selectedHour, setSelectedHour] = useState(21);
  const [selectedMinute, setSelectedMinute] = useState(0);

  const { data: group, refetch } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => fetchGroup(groupId),
  });

  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });

  const gameName = useMemo(() => {
    const id = user?.selectedGame;
    return games.find((g) => g.id === id)?.name ?? games[0]?.name ?? '';
  }, [games, user?.selectedGame]);

  const creatorLabel = useMemo(() => {
    if (!group || !user) return '';
    if (group.createdById === user.id) return t('groupDetail.createdByYou');
    const creator = group.members.find((m) => m.id === group.createdById);
    return t('groupDetail.createdBy', { name: creator?.name ?? '—' });
  }, [group, user, t]);

  const createdDateLabel = useMemo(() => {
    if (!group) return '';
    return new Date(group.createdAt).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [group]);

  const groupPhotoUri = group?.photoUrl ?? group?.members.find((m) => m.role === 'admin')?.photoUrl;
  const isGroupCreator = !!user && !!group && group.createdById === user.id;

  const onSchedule = async () => {
    if (!isGroupCreator) {
      Alert.alert(t('groups.scheduleLeaderOnlyTitle'), t('groups.scheduleLeaderOnlyBody'));
      return;
    }
    if (group?.nextSession) {
      showTopToast(t('groups.scheduleAlreadyExists'));
      return;
    }
    setScheduleModalOpen(true);
  };

  const confirmSchedule = async () => {
    const startsAt = new Date(selectedDate);
    startsAt.setHours(selectedHour, selectedMinute, 0, 0);
    const dayOfWeek = startsAt.getDay();
    const timeLocal = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    setScheduleModalOpen(false);
    try {
      await createGroupSchedule(groupId, { dayOfWeek, timeLocal, startsAt: startsAt.toISOString() });
      await refetch();
      showTopToast(t('groupDetail.scheduleDone'));
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.code === 'session_already_scheduled') {
        showTopToast(t('groups.scheduleAlreadyExists'));
        return;
      }
      Alert.alert(t('groups.scheduleFailedTitle'), apiErr.message || t('groups.scheduleFailedBody'));
    }
  };

  const onSquadFill = async () => {
    const data = await fetchSquadFillSuggestions(groupId);
    setSuggestions(data.suggestions);
    setSquadModalOpen(true);
  };

  const onInvite = async (userId: string) => {
    await inviteSquadFill(groupId, userId, group?.nextSession?.id);
    await qc.invalidateQueries({ queryKey: ['group', groupId] });
    setSquadModalOpen(false);
    showTopToast(t('groupDetail.inviteSentBody'));
  };

  const onRsvp = async (status: 'confirmed' | 'declined') => {
    if (!group?.nextSession) return;
    try {
      await setSessionRsvp(group.nextSession.id, status);
      await refetch();
      showTopToast(
        status === 'confirmed'
          ? t('groups.rsvpConfirmedSelf')
          : t('groups.rsvpDeclinedSelf'),
      );
    } catch (err) {
      const apiErr = getApiError(err);
      Alert.alert(t('groups.rsvpFailedTitle'), apiErr.message || t('groups.rsvpFailedBody'));
    }
  };

  const onShare = async () => {
    if (!group) return;
    try {
      await Share.share({ message: t('groupDetail.shareMessage', { name: group.name }) });
    } catch {
      /* user cancelled */
    }
  };

  const openChat = () => {
    if (group?.conversationId) {
      navigation.navigate('Chat', {
        conversationId: group.conversationId,
        groupId: group.id,
        title: group.name,
        type: 'group',
      });
    }
  };

  const footerBottom = Math.max(insets.bottom, 12);

  if (!group) {
    return (
      <TeamScreenBackground style={[styles.root, styles.centered]}>
        <StatusBar style="light" />
        <Text style={{ color: colors.ink.secondary }}>{t('common.loading')}</Text>
      </TeamScreenBackground>
    );
  }

  return (
    <TeamScreenBackground style={styles.root}>
      <StatusBar style="light" backgroundColor={PURE_BLACK} />
      <LinearGradient
        colors={['rgba(123,63,242,0.14)', 'rgba(0,209,255,0.05)', 'transparent']}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: footerBottom + 88,
          }}
        >
          {justCreated ? (
            <View style={styles.heroSuccess}>
              <HexagonSuccessBadge size={76} />
            </View>
          ) : null}

          <View style={styles.heroTitleWrap}>
            <GradientTitle text={group.name} />
            {justCreated ? (
              <Text style={styles.heroSubtitle}>{t('groupDetail.createdSuccess')}</Text>
            ) : (
              <Text style={styles.heroSubtitle}>
                {t('groupDetail.memberCount', { count: group.members.length })}
              </Text>
            )}
          </View>

          <View style={styles.infoCard}>
            <Pressable
              onPress={() => Alert.alert(t('groupDetail.editPhoto'), t('groupDetail.editPhotoSoon'))}
              style={styles.infoPhotoCol}
            >
              <HexagonFrame
                size={80}
                uri={groupPhotoUri}
                initials={group.name.slice(0, 2).toUpperCase()}
                accent="purple"
              />
              <View style={styles.editPhotoBtn}>
                <Ionicons name="pencil" size={12} color="#fff" />
              </View>
            </Pressable>

            <View style={styles.infoTextCol}>
              <Text style={styles.infoName}>{group.name}</Text>
              {gameName ? (
                <View style={styles.infoMetaRow}>
                  {user?.selectedGame && getGameImage(user.selectedGame) ? (
                    <Image source={getGameImage(user.selectedGame)!} style={styles.gameIcon} />
                  ) : (
                    <Ionicons name="game-controller" size={14} color={colors.brand.blue} />
                  )}
                  <Text style={styles.infoGame}>{gameName}</Text>
                </View>
              ) : null}
              <View style={styles.infoMetaRow}>
                <Ionicons name="calendar-outline" size={13} color={colors.ink.disabled} />
                <Text style={styles.infoMeta}>
                  {t('groupDetail.createdOn', { date: createdDateLabel })}
                </Text>
              </View>
              <View style={styles.infoMetaRow}>
                <Ionicons name="person-outline" size={13} color={colors.ink.disabled} />
                <Text style={styles.infoMeta}>{creatorLabel}</Text>
              </View>
            </View>

            <Pressable
              onPress={onShare}
              style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="share-social-outline" size={18} color={colors.brand.blue} />
            </Pressable>
          </View>

          <GroupNextSessionCard
            group={group}
            userId={user?.id}
            onRsvp={(status) => void onRsvp(status)}
          />

          <Text style={styles.sectionTitle}>{t('groupDetail.quickActions')}</Text>
          <View style={styles.quickRow}>
            {isGroupCreator ? (
              <Pressable
                onPress={() => void onSchedule()}
                style={({ pressed }) => [styles.quickBtn, { opacity: pressed ? 0.88 : 1 }]}
              >
                <Ionicons name="calendar-outline" size={22} color="#fff" />
                <Text style={styles.quickBtnText}>{t('groups.schedule')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={openChat}
              style={({ pressed }) => [styles.quickBtn, { opacity: pressed ? 0.88 : 1 }]}
              disabled={!group.conversationId}
            >
              <Ionicons name="chatbubble-outline" size={22} color={colors.brand.blue} />
              <Text style={styles.quickBtnText}>{t('groups.openChat')}</Text>
            </Pressable>
            <Pressable
              onPress={onSquadFill}
              style={({ pressed }) => [styles.quickBtn, { opacity: pressed ? 0.88 : 1 }]}
            >
              <Ionicons name="person-add-outline" size={22} color={colors.brand.pink} />
              <Text style={styles.quickBtnText}>{t('groups.completeSquad')}</Text>
            </Pressable>
          </View>

          <View style={styles.membersHead}>
            <Text style={styles.sectionTitle}>
              {t('groupDetail.members', { count: group.members.length })}
            </Text>
            <Pressable onPress={onSquadFill}>
              <Text style={styles.manageLink}>{t('groupDetail.manageMembers')}</Text>
            </Pressable>
          </View>

          <View style={styles.membersList}>
            {group.members.map((m) => {
              const isLeader = m.role === 'admin' || m.id === group.createdById;
              return (
                <View key={m.id} style={styles.memberRow}>
                  <View style={styles.memberAvatarWrap}>
                    <Avatar
                      uri={m.photoUrl}
                      name={m.name}
                      size={48}
                      glow
                    />
                    <View
                      style={[
                        styles.memberOnlineDot,
                        { backgroundColor: m.isOnline ? '#00E676' : '#5C5C6A' },
                      ]}
                    />
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      {isLeader ? (
                        <Ionicons name="ribbon" size={14} color={colors.brand.purple} />
                      ) : null}
                    </View>
                    <View style={styles.memberStatusRow}>
                      <View
                        style={[
                          styles.memberStatusDot,
                          { backgroundColor: m.isOnline ? '#00E676' : '#5C5C6A' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.memberStatus,
                          m.isOnline && styles.memberStatusOnline,
                        ]}
                      >
                        {m.isOnline ? t('recent.online') : t('recent.offline')}
                      </Text>
                    </View>
                  </View>
                  {isLeader ? (
                    <View style={styles.leaderBadge}>
                      <Text style={styles.leaderBadgeText}>{t('groupDetail.leader')}</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setMemberMenuId(m.id)}
                      hitSlop={10}
                      style={styles.memberMenuBtn}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={18}
                        color={colors.ink.secondary}
                      />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          {group.schedules.length > 0 ? (
            <View style={styles.scheduleNote}>
              {group.schedules.map((s) => (
                <Text key={s.id} style={styles.scheduleLine}>
                  {t('groupDetail.scheduleLine', {
                    day: s.dayOfWeek,
                    time: s.timeLocal,
                    frequency: s.frequency,
                  })}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.inviteCard}>
            <LinearGradient
              colors={['rgba(123,63,242,0.35)', 'rgba(255,77,166,0.25)']}
              style={styles.inviteIconBox}
            >
              <Ionicons name="people" size={22} color={colors.brand.pink} />
            </LinearGradient>
            <View style={styles.inviteText}>
              <Text style={styles.inviteTitle}>{t('groupDetail.inviteTitle')}</Text>
              <Text style={styles.inviteBody}>{t('groupDetail.inviteBody')}</Text>
            </View>
            <Pressable onPress={onSquadFill} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
              <LinearGradient
                colors={[colors.brand.pink, colors.brand.blue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.inviteBtn}
              >
                <Text style={styles.inviteBtnText}>{t('groups.invite')}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerBottom }]}>
          <GradientButton
            title={t('groupDetail.goToChat')}
            onPress={openChat}
            disabled={!group.conversationId}
            leftAdornment={<Ionicons name="chatbubbles" size={20} color="#fff" />}
          />
        </View>
      </SafeAreaView>

      <Modal visible={squadModalOpen} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setSquadModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('groups.completeSquad')}</Text>
            {suggestions.length === 0 ? (
              <Text style={styles.modalEmpty}>{t('groupDetail.noSuggestions')}</Text>
            ) : (
              suggestions.map((s) => (
                <Pressable
                  key={s.userId}
                  onPress={() => onInvite(s.userId)}
                  style={({ pressed }) => [styles.suggestionRow, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <Avatar uri={s.photoUrl} name={s.name} size={40} glow={false} />
                  <Text style={styles.suggestionName}>{s.name}</Text>
                  <Text style={styles.suggestionAction}>{t('groups.invite')}</Text>
                </Pressable>
              ))
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={scheduleModalOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setScheduleModalOpen(false)}>
          <Pressable style={styles.scheduleModalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('groupChat.scheduleMatch')}</Text>
            <Text style={styles.scheduleLabel}>{t('groupChat.selectDate')}</Text>
            <View style={styles.datePickerRow}>
              <Pressable
                onPress={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() - 1);
                  setSelectedDate(next);
                }}
                style={styles.dateNavBtn}
              >
                <Ionicons name="chevron-back" size={18} color={colors.ink.secondary} />
              </Pressable>
              <Text style={styles.dateLabel}>
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Pressable
                onPress={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedDate(next);
                }}
                style={styles.dateNavBtn}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.ink.secondary} />
              </Pressable>
            </View>

            <Text style={[styles.scheduleLabel, { marginTop: 12 }]}>{t('groupChat.selectTime')}</Text>
            <View style={styles.scheduleTimeRow}>
              <ScrollView style={styles.scheduleTimeCol} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <Pressable
                    key={hour}
                    onPress={() => setSelectedHour(hour)}
                    style={[styles.scheduleTimeOption, selectedHour === hour && styles.scheduleTimeOptionActive]}
                  >
                    <Text style={[styles.scheduleTimeText, selectedHour === hour && styles.scheduleTimeTextActive]}>
                      {String(hour).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.scheduleColon}>:</Text>
              <ScrollView style={styles.scheduleTimeCol} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                  <Pressable
                    key={minute}
                    onPress={() => setSelectedMinute(minute)}
                    style={[styles.scheduleTimeOption, selectedMinute === minute && styles.scheduleTimeOptionActive]}
                  >
                    <Text
                      style={[
                        styles.scheduleTimeText,
                        selectedMinute === minute && styles.scheduleTimeTextActive,
                      ]}
                    >
                      {String(minute).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={styles.scheduleActions}>
              <Pressable style={styles.scheduleCancelBtn} onPress={() => setScheduleModalOpen(false)}>
                <Text style={styles.scheduleCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.scheduleConfirmBtn} onPress={confirmSchedule}>
                <Text style={styles.scheduleConfirmText}>{t('common.confirm')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!memberMenuId} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setMemberMenuId(null)}>
          <View style={styles.memberMenuSheet}>
            <Pressable
              onPress={() => {
                const id = memberMenuId;
                setMemberMenuId(null);
                if (id) navigation.navigate('UserProfile', { userId: id });
              }}
              style={styles.memberMenuItem}
            >
              <Text style={styles.memberMenuText}>{t('groupDetail.viewProfile')}</Text>
            </Pressable>
            <Pressable onPress={() => setMemberMenuId(null)} style={styles.memberMenuItem}>
              <Text style={[styles.memberMenuText, { color: colors.ink.secondary }]}>
                {t('common.cancel')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </TeamScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  safe: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  topBar: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSuccess: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  heroTitleWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  heroSubtitle: {
    color: colors.ink.secondary,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    marginBottom: 20,
  },
  infoPhotoCol: {
    marginRight: 12,
  },
  editPhotoBtn: {
    position: 'absolute',
    right: -2,
    bottom: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1A1A24',
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  infoName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoMetaRow: {
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
  infoGame: {
    color: colors.brand.blue,
    fontSize: 13,
    fontWeight: '700',
  },
  infoMeta: {
    color: colors.ink.disabled,
    fontSize: 12,
    flex: 1,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,209,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,209,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  quickBtnText: {
    color: colors.ink.secondary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
  membersHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  manageLink: {
    color: colors.brand.purple,
    fontSize: 13,
    fontWeight: '700',
  },
  membersList: {
    gap: 10,
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  memberAvatarWrap: {
    position: 'relative',
  },
  memberOnlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: CARD_BG,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  memberStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  memberStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  memberStatus: {
    color: colors.ink.disabled,
    fontSize: 12,
    fontWeight: '600',
  },
  memberStatusOnline: {
    color: '#00E676',
  },
  leaderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(123,63,242,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(123,63,242,0.45)',
  },
  leaderBadgeText: {
    color: colors.brand.purple,
    fontSize: 11,
    fontWeight: '800',
  },
  memberMenuBtn: {
    padding: 4,
  },
  scheduleNote: {
    marginBottom: 14,
    gap: 4,
  },
  scheduleLine: {
    color: colors.ink.disabled,
    fontSize: 12,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  inviteIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteText: {
    flex: 1,
    minWidth: 0,
  },
  inviteTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  inviteBody: {
    color: colors.ink.disabled,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  inviteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  inviteBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderTopWidth: 1,
    borderTopColor: CARD_BORDER,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#12121A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '55%',
  },
  scheduleModalSheet: {
    backgroundColor: '#12121A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },
  scheduleLabel: {
    color: colors.ink.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1A1A24',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 140,
    marginBottom: 14,
  },
  scheduleTimeCol: {
    flex: 1,
    backgroundColor: '#1A1A24',
    borderRadius: 10,
  },
  scheduleTimeOption: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  scheduleTimeOptionActive: {
    backgroundColor: 'rgba(123,63,242,0.2)',
  },
  scheduleTimeText: {
    color: colors.ink.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  scheduleTimeTextActive: {
    color: colors.brand.purple,
    fontWeight: '800',
  },
  scheduleColon: {
    color: colors.ink.secondary,
    fontSize: 20,
    fontWeight: '700',
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 10,
  },
  scheduleCancelBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#1A1A24',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  scheduleConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: colors.brand.purple,
  },
  scheduleCancelText: {
    color: colors.ink.secondary,
    fontWeight: '700',
  },
  scheduleConfirmText: {
    color: '#fff',
    fontWeight: '800',
  },
  modalEmpty: {
    color: colors.ink.secondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  suggestionName: {
    flex: 1,
    color: '#fff',
    fontWeight: '700',
  },
  suggestionAction: {
    color: colors.brand.blue,
    fontWeight: '700',
    fontSize: 13,
  },
  memberMenuSheet: {
    marginHorizontal: 24,
    marginBottom: 40,
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    overflow: 'hidden',
  },
  memberMenuItem: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  memberMenuText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
