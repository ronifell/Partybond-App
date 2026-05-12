import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/ui/Screen';
import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { OnboardingHeader } from '../components/OnboardingHeader';
import { setGameProfile } from '../api/users';
import { useAuth } from '../store/authStore';
import { getApiError } from '../api/client';

export function OnboardingGameInfoScreen({ route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const setUser = useAuth((s) => s.setUser);
  const gameId = (route.params as { gameId: string }).gameId;

  const [nickname, setNickname] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!nickname.trim() || !playerId.trim()) {
      setError(t('auth.errors.generic'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const updated = await setGameProfile({
        gameId,
        nickname: nickname.trim(),
        playerId: playerId.trim(),
      });
      setUser(updated);
      // RootNavigator will switch stacks automatically
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard>
      <BackgroundGlow />
      <View className="flex-1 py-4">
        <OnboardingHeader
          current={4}
          total={4}
          title={t('onboarding.step4Title')}
          subtitle={t('onboarding.step4Subtitle')}
        />

        <View className="gap-4">
          <Input
            label={t('onboarding.nickname')}
            value={nickname}
            onChangeText={setNickname}
            placeholder={t('onboarding.nicknamePlaceholder')}
          />
          <Input
            label={t('onboarding.playerId')}
            value={playerId}
            onChangeText={setPlayerId}
            placeholder={t('onboarding.playerIdPlaceholder')}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
              marginTop: 8,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: 'rgba(123, 63, 242, 0.45)',
              backgroundColor: 'rgba(123, 63, 242, 0.16)',
            }}
          >
            <Ionicons name="information-circle" size={20} color="#C5A8FF" />
            <Text style={{ color: '#D8D8E8', flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' }}>
              {t('onboarding.help')}
            </Text>
          </View>
          {error ? <Text className="text-status-error text-sm">{error}</Text> : null}
        </View>

        <View className="mt-auto pt-8">
          <GradientButton title={t('common.continue')} onPress={onSubmit} loading={loading} />
        </View>
      </View>
    </Screen>
  );
}
