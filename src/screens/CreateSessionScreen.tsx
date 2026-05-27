import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, useWindowDimensions, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { Avatar } from '../components/ui/Avatar';
import { GameProfileRequiredNotice } from '../components/GameProfileRequiredNotice';
import { CreateSquadGameRow } from '../components/CreateSquadGameRow';
import { hasGameProfileForGame } from '../utils/gameProfile';
import {
  createSession,
  joinQueue,
  listSessions,
  sendSessionSquadInvites,
} from '../api/sessions';
import { fetchGameProfileUsers } from '../api/social';
import { fetchGames } from '../api/games';
import { useAuth } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { getApiError } from '../api/client';
import { colors } from '../theme/tokens';

const H_PADDING = 12;

/** Squad sessions invite specific players; mode/tier only apply if strangers join the queue. */
const SQUAD_SESSION_MODE = 'casual' as const;
const SQUAD_SESSION_SKILL_TIER = 'beginner' as const;

const SECTION_LABEL_STYLE = {
  color: colors.ink.secondary,
  marginBottom: 10,
  fontSize: 12,
  fontWeight: '700' as const,
  letterSpacing: 0.6,
  textTransform: 'uppercase' as const,
};

export function CreateSessionScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const route = useRoute();
  const { width: windowWidth } = useWindowDimensions();
  const user = useAuth((s) => s.user);
  const refreshMe = useAuth((s) => s.refreshMe);
  const qc = useQueryClient();
  const showTopToast = useNotificationStore((s) => s.showTopToast);

  const defaultGameId = (route.params as { defaultGameId?: string } | undefined)?.defaultGameId;

  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });
  const { data: allSessions = [] } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => listSessions(),
  });
  const activeGames = useMemo(() => games.filter((g) => g.status === 'active'), [games]);

  const playersActiveByGame = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of allSessions) {
      map[s.gameId] = (map[s.gameId] ?? 0) + s.waitingCount;
    }
    return map;
  }, [allSessions]);

  const columnWidth = windowWidth - H_PADDING * 2;

  const [gameId, setGameId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileGateGame, setProfileGateGame] = useState<{ id: string; name: string } | null>(
    null,
  );

  const hasGameProfile = useCallback(
    (gid: string) => hasGameProfileForGame(user, gid),
    [user],
  );

  const selectedGame = useMemo(
    () => activeGames.find((g) => g.id === gameId) ?? null,
    [activeGames, gameId],
  );

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['game-profile-users', gameId],
    queryFn: () => fetchGameProfileUsers(gameId!),
    enabled: !!gameId,
  });

  const onlineCandidates = useMemo(
    () => candidates.filter((c) => c.isOnline),
    [candidates],
  );
  const otherCandidates = useMemo(
    () => candidates.filter((c) => !c.isOnline),
    [candidates],
  );

  useEffect(() => {
    if (activeGames.length === 0) {
      setGameId(null);
      return;
    }
    setGameId((prev) => {
      if (prev && activeGames.some((g) => g.id === prev)) return prev;
      const fromRoute =
        defaultGameId && activeGames.some((g) => g.id === defaultGameId) ? defaultGameId : undefined;
      const fromProfile =
        user?.selectedGame && activeGames.some((g) => g.id === user.selectedGame)
          ? user.selectedGame
          : undefined;
      return fromRoute ?? fromProfile ?? activeGames[0]!.id;
    });
  }, [activeGames, defaultGameId, user?.selectedGame]);

  useEffect(() => {
    setInvitedIds(new Set());
  }, [gameId]);

  const toggleInvite = (userId: string) => {
    setInvitedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const renderCandidate = (c: (typeof candidates)[0]) => {
    const invited = invitedIds.has(c.userId);
    return (
      <View key={c.userId} style={styles.candidateRow}>
        <Avatar uri={c.photoUrl} name={c.name} size={44} glow={false} />
        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName} numberOfLines={1}>
            {c.name}
          </Text>
          <Text style={styles.candidateMeta} numberOfLines={2}>
            {c.nickname ? `${c.nickname} · ` : ''}
            {c.isOnline ? t('recent.online') : t('createSquad.offline')}
          </Text>
        </View>
        <Pressable
          onPress={() => toggleInvite(c.userId)}
          style={({ pressed }) => [
            styles.inviteBtn,
            invited && styles.inviteBtnActive,
            { opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={[styles.inviteBtnText, invited && styles.inviteBtnTextActive]}>
            {invited ? t('createSquad.invited') : t('createSquad.invite')}
          </Text>
        </Pressable>
      </View>
    );
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      setError(t('auth.errors.generic'));
      return;
    }
    const gid =
      gameId && activeGames.some((g) => g.id === gameId) ? gameId : activeGames[0]?.id ?? null;
    if (!gid || !selectedGame) {
      setError(t('createSquad.noActiveGames'));
      return;
    }
    if (!hasGameProfile(gid)) {
      setProfileGateGame({ id: selectedGame.id, name: selectedGame.name });
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const inviteList = [...invitedIds];
      const playersNeeded = Math.min(
        selectedGame.maxPlayers,
        Math.max(2, 1 + inviteList.length),
      );

      const session = await createSession({
        gameId: gid,
        title: title.trim(),
        gameMode: SQUAD_SESSION_MODE,
        skillTier: SQUAD_SESSION_SKILL_TIER,
        playersNeeded,
      });

      await joinQueue(session.id);
      await refreshMe();

      if (inviteList.length > 0) {
        await sendSessionSquadInvites(session.id, inviteList);
        showTopToast(t('createSquad.invitesSent', { count: inviteList.length }));
      }

      qc.invalidateQueries({ queryKey: ['sessions'] });
      navigation.replace('Queue', { sessionId: session.id });
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.code === 'no_game_profile' && selectedGame) {
        setProfileGateGame({ id: selectedGame.id, name: selectedGame.name });
      } else {
        setError(apiErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard padded={false}>
      <BackgroundGlow />

      <View style={{ flex: 1, width: '100%', alignItems: 'center', paddingTop: 8, paddingBottom: 24 }}>
        <View style={{ width: columnWidth, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2 active:opacity-70">
              <Ionicons name="chevron-back" size={26} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-bold ml-2">{t('createSquad.title')}</Text>
          </View>
          <Text style={styles.subtitle}>{t('createSquad.subtitle')}</Text>

          <View className="gap-5 py-2">
            <View>
              <View style={styles.selectGameHeader}>
                <Ionicons name="game-controller" size={14} color={colors.brand.purple} />
                <Text style={styles.selectGameLabel}>{t('createSquad.selectGameLabel')}</Text>
              </View>
              {activeGames.length === 0 ? (
                <Text style={{ color: colors.ink.secondary, fontSize: 14 }}>
                  {t('createSquad.noActiveGames')}
                </Text>
              ) : (
                <View style={styles.gameList}>
                  {activeGames.map((g) => (
                    <CreateSquadGameRow
                      key={g.id}
                      game={g}
                      selected={gameId === g.id}
                      playersActive={playersActiveByGame[g.id] ?? 0}
                      onPress={() => setGameId(g.id)}
                    />
                  ))}
                </View>
              )}
            </View>

            <View>
              <Text style={SECTION_LABEL_STYLE}>{t('createSquad.name')}</Text>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder={t('createSquad.titlePlaceholder')}
                compact
              />
            </View>

            <View>
              <Text style={SECTION_LABEL_STYLE}>{t('createSquad.invitePlayers')}</Text>
              <Text style={styles.sectionHint}>{t('createSquad.invitePlayersHint')}</Text>

              {candidatesLoading ? (
                <Text style={styles.emptyCandidates}>{t('common.loading')}</Text>
              ) : candidates.length === 0 ? (
                <Text style={styles.emptyCandidates}>{t('createSquad.noCandidates')}</Text>
              ) : (
                <View style={styles.candidateList}>
                  {onlineCandidates.length > 0 ? (
                    <>
                      <Text style={styles.candidateGroupLabel}>{t('createSquad.onlineNow')}</Text>
                      {onlineCandidates.map(renderCandidate)}
                    </>
                  ) : null}
                  {otherCandidates.length > 0 ? (
                    <>
                      <Text style={[styles.candidateGroupLabel, { marginTop: 8 }]}>
                        {t('createSquad.recentAndSuggestions')}
                      </Text>
                      {otherCandidates.map(renderCandidate)}
                    </>
                  ) : null}
                </View>
              )}

              {invitedIds.size > 0 ? (
                <Text style={styles.invitedCount}>
                  {t('createSquad.selectedCount', { count: invitedIds.size })}
                </Text>
              ) : null}
            </View>

            {error ? <Text style={{ color: colors.status.error, fontSize: 13 }}>{error}</Text> : null}
          </View>

          <View style={{ marginTop: 'auto', paddingTop: 24 }}>
            <GradientButton
              title={t('createSquad.submit')}
              onPress={onSubmit}
              loading={loading}
            />
          </View>
        </View>
      </View>

      {profileGateGame ? (
        <GameProfileRequiredNotice
          gameName={profileGateGame.name}
          onDismiss={() => setProfileGateGame(null)}
          onGoToProfile={() => {
            const g = profileGateGame;
            setProfileGateGame(null);
            navigation.navigate('EditGameProfile', { gameId: g.id });
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  selectGameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  selectGameLabel: {
    color: colors.brand.purple,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  gameList: {
    gap: 8,
  },
  subtitle: {
    color: colors.ink.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionHint: {
    color: colors.ink.disabled,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  candidateList: {
    gap: 8,
  },
  candidateGroupLabel: {
    color: colors.brand.pink,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(10,10,18,0.75)',
  },
  candidateInfo: {
    flex: 1,
    minWidth: 0,
  },
  candidateName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  candidateMeta: {
    color: colors.ink.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  inviteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.brand.purple,
    backgroundColor: 'rgba(123,63,242,0.12)',
  },
  inviteBtnActive: {
    backgroundColor: colors.brand.purple,
    borderColor: colors.brand.purple,
  },
  inviteBtnText: {
    color: colors.brand.purple,
    fontSize: 12,
    fontWeight: '800',
  },
  inviteBtnTextActive: {
    color: '#fff',
  },
  emptyCandidates: {
    color: colors.ink.secondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  invitedCount: {
    color: colors.brand.blue,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
});
