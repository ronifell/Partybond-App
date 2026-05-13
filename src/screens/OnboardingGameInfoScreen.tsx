import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/ui/Screen';
import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { OnboardingHeader } from '../components/OnboardingHeader';
import { OnboardingBackBar } from '../components/OnboardingBackBar';
import { setGameProfile } from '../api/users';
import { useAuth } from '../store/authStore';
import { useOnboarding } from '../store/onboardingStore';
import { getApiError } from '../api/client';
import { colors } from '../theme/tokens';

export function OnboardingGameInfoScreen({ route, navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const setUser = useAuth((s) => s.setUser);
  const setCelebrationPending = useOnboarding((s) => s.setCelebrationPending);
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
      setCelebrationPending(true);
      setUser(updated);
      navigation.reset({ index: 0, routes: [{ name: 'OnboardingComplete' }] });
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard padded={false} onboardingArt>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
        <OnboardingBackBar navigation={navigation} />
        <OnboardingHeader
          current={4}
          total={4}
          title={t('onboarding.step4Title')}
          subtitle={t('onboarding.step4Subtitle')}
        />

        <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center', gap: 12, marginTop: 8 }}>
          <Input
            label={t('onboarding.nickname')}
            value={nickname}
            onChangeText={setNickname}
            placeholder={t('onboarding.nicknamePlaceholder')}
            leftIcon={<Ionicons name="game-controller-outline" size={20} color={colors.brand.purple} />}
          />
          <Input
            label={t('onboarding.playerId')}
            value={playerId}
            onChangeText={setPlayerId}
            placeholder={t('onboarding.playerIdPlaceholder')}
            leftIcon={<Ionicons name="id-card-outline" size={20} color={colors.brand.purple} />}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
              marginTop: 4,
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
          {error ? (
            <Text style={{ color: colors.status.error, fontSize: 13, fontWeight: '600' }}>{error}</Text>
          ) : null}
        </View>

        <View style={{ marginTop: 'auto', paddingTop: 24, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
          <GradientButton title={t('common.continue')} onPress={onSubmit} loading={loading} />
        </View>
      </View>
    </Screen>
  );
}
