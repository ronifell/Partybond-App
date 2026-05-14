import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { SegmentToggle } from '../components/ui/SegmentToggle';
import { createSession } from '../api/sessions';
import { fetchGames } from '../api/games';
import { useAuth } from '../store/authStore';
import { getApiError } from '../api/client';
import { colors } from '../theme/tokens';

const MODES = ['casual', 'competitive'] as const;
const SIZES: Array<2 | 4> = [2, 4];

const FORM_MAX = 400;
const H_PADDING = 24;

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
  const qc = useQueryClient();

  const defaultGameId = (route.params as { defaultGameId?: string } | undefined)?.defaultGameId;

  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });
  const activeGames = useMemo(() => games.filter((g) => g.status === 'active'), [games]);

  const columnWidth = Math.min(windowWidth - H_PADDING * 2, FORM_MAX);

  const [gameId, setGameId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<(typeof MODES)[number]>('casual');
  const [size, setSize] = useState<(typeof SIZES)[number]>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onSubmit = async () => {
    if (!title.trim()) {
      setError(t('auth.errors.generic'));
      return;
    }
    const gid =
      gameId && activeGames.some((g) => g.id === gameId) ? gameId : activeGames[0]?.id ?? null;
    if (!gid) {
      setError(t('createSession.noActiveGames'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const session = await createSession({
        gameId: gid,
        title: title.trim(),
        gameMode: mode,
        playersNeeded: size,
      });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      navigation.replace('Session', { sessionId: session.id });
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard padded={false}>
      <BackgroundGlow />

      <View style={{ flex: 1, width: '100%', alignItems: 'center', paddingTop: 8, paddingBottom: 24 }}>
        <View style={{ width: columnWidth, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2 active:opacity-70">
              <Ionicons name="chevron-back" size={26} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-bold ml-2">{t('createSession.title')}</Text>
          </View>

          <View className="gap-5 py-2">
            <View>
              <Text style={SECTION_LABEL_STYLE}>{t('createSession.gameLabel')}</Text>
              {activeGames.length === 0 ? (
                <Text style={{ color: colors.ink.secondary, fontSize: 14 }}>{t('createSession.noActiveGames')}</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {activeGames.map((g) => {
                    const selected = gameId === g.id;
                    return (
                      <Pressable
                        key={g.id}
                        onPress={() => setGameId(g.id)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                          borderWidth: 1.5,
                          borderColor: selected ? colors.brand.purple : 'rgba(255,255,255,0.12)',
                          backgroundColor: selected ? 'rgba(123,63,242,0.18)' : 'rgba(10,10,18,0.75)',
                          opacity: pressed ? 0.9 : 1,
                        })}
                      >
                        <Text
                          style={{ color: colors.ink.primary, fontWeight: '700', fontSize: 15, flex: 1 }}
                          numberOfLines={2}
                        >
                          {g.name}
                        </Text>
                        {selected ? (
                          <Ionicons name="checkmark-circle" size={22} color={colors.brand.purple} />
                        ) : (
                          <Ionicons name="ellipse-outline" size={22} color={colors.ink.secondary} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View>
              <Text style={SECTION_LABEL_STYLE}>{t('createSession.name')}</Text>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder={t('createSession.titlePlaceholder')}
                compact
              />
            </View>

            <View>
              <Text style={SECTION_LABEL_STYLE}>{t('createSession.mode')}</Text>
              <SegmentToggle
                value={mode}
                onChange={setMode}
                options={MODES.map((m) => ({ value: m, label: t(`createSession.${m}`) }))}
              />
            </View>

            <View>
              <Text style={SECTION_LABEL_STYLE}>{t('createSession.playersNeeded')}</Text>
              <SegmentToggle
                value={size}
                onChange={setSize}
                options={SIZES.map((s) => ({ value: s, label: String(s) }))}
              />
            </View>

            {error ? <Text style={{ color: colors.status.error, fontSize: 13 }}>{error}</Text> : null}
          </View>

          <View style={{ marginTop: 'auto', paddingTop: 24 }}>
            <GradientButton title={t('createSession.schedule')} onPress={onSubmit} loading={loading} />
          </View>
        </View>
      </View>
    </Screen>
  );
}
