import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { setGameProfile } from '../api/users';
import { useAuth } from '../store/authStore';
import { getApiError } from '../api/client';
import { colors } from '../theme/tokens';

export function EditGameProfileScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);

  const gameId = (route.params as { gameId: string }).gameId;
  const existing = user?.gameProfiles.find((p) => p.gameId === gameId);

  const [nickname, setNickname] = useState(existing?.nickname ?? '');
  const [playerId, setPlayerId] = useState(existing?.playerId ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
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
      navigation.goBack();
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard>
      <BackgroundGlow />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            padding: 8,
            marginLeft: -8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={26} color="white" />
        </Pressable>
        <Text
          style={{
            color: 'white',
            fontSize: 22,
            fontWeight: '800',
            letterSpacing: -0.3,
            marginLeft: 8,
          }}
        >
          {t('profile.editGameProfile')}
        </Text>
      </View>

      <View style={{ gap: 16, marginBottom: 24 }}>
        <Input
          label={t('onboarding.nickname')}
          value={nickname}
          onChangeText={setNickname}
          placeholder={t('onboarding.nicknamePlaceholder')}
          leftIcon={<Ionicons name="person-outline" size={20} color={colors.brand.purple} />}
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
        {error ? (
          <Text style={{ color: colors.status.error, fontSize: 13, fontWeight: '600' }}>
            {error}
          </Text>
        ) : null}
      </View>

      <GradientButton title={t('common.save')} onPress={onSave} loading={loading} />
    </Screen>
  );
}
