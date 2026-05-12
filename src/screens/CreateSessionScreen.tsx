import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { SegmentToggle } from '../components/ui/SegmentToggle';
import { createSession } from '../api/sessions';
import { useAuth } from '../store/authStore';
import { getApiError } from '../api/client';
import { colors } from '../theme/tokens';

const MODES = ['casual', 'competitive'] as const;
const SIZES: Array<2 | 4> = [2, 4];

export function CreateSessionScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<(typeof MODES)[number]>('casual');
  const [size, setSize] = useState<(typeof SIZES)[number]>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!user?.selectedGame || !title.trim()) {
      setError(t('auth.errors.generic'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const session = await createSession({
        gameId: user.selectedGame,
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
    <Screen scroll keyboard>
      <BackgroundGlow />

      <View className="flex-row items-center mb-4">
        <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2 active:opacity-70">
          <Ionicons name="chevron-back" size={26} color="white" />
        </Pressable>
        <Text className="text-white text-xl font-bold ml-2">{t('createSession.title')}</Text>
      </View>

      <View className="gap-5 py-2">
        <Input
          label={t('createSession.name')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('createSession.titlePlaceholder')}
        />

        <View>
          <Text
            style={{
              color: colors.ink.secondary,
              marginBottom: 10,
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            {t('createSession.mode')}
          </Text>
          <SegmentToggle
            value={mode}
            onChange={setMode}
            options={MODES.map((m) => ({ value: m, label: t(`createSession.${m}`) }))}
          />
        </View>

        <View>
          <Text
            style={{
              color: colors.ink.secondary,
              marginBottom: 10,
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            {t('createSession.playersNeeded')}
          </Text>
          <SegmentToggle
            value={size}
            onChange={setSize}
            options={SIZES.map((s) => ({ value: s, label: String(s) }))}
          />
        </View>

        {error ? <Text style={{ color: colors.status.error, fontSize: 13 }}>{error}</Text> : null}
      </View>

      <View className="mt-auto pt-8">
        <GradientButton title={t('createSession.schedule')} onPress={onSubmit} loading={loading} />
      </View>
    </Screen>
  );
}
