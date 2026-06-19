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
import { useAuth } from '../store/authStore';
import { updateProfile } from '../api/users';
import { getApiError } from '../api/client';
import { MIN_USER_AGE } from '../config/constants';
import { colors } from '../theme/tokens';

export function OnboardingNameScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const [name, setName] = useState(user?.name ?? '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onNext = async () => {
    const ageNum = Number(age);
    if (!name.trim() || !ageNum || ageNum < MIN_USER_AGE) {
      setError(t('auth.errors.ageTooYoung', { min: MIN_USER_AGE }));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const updated = await updateProfile({ name: name.trim(), age: ageNum });
      setUser(updated);
      navigation.navigate('OnboardingPhoto');
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
          current={1}
          total={4}
          title={t('onboarding.step1Title')}
          subtitle={t('onboarding.step1Subtitle')}
        />
        <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center', gap: 12, marginTop: 8 }}>
          <Input
            label={t('auth.name')}
            value={name}
            onChangeText={setName}
            placeholder={t('auth.namePlaceholder')}
            leftIcon={<Ionicons name="person-outline" size={20} color={colors.brand.purple} />}
          />
          <Input
            label={t('auth.age')}
            value={age}
            onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder={t('auth.agePlaceholder')}
            leftIcon={<Ionicons name="calendar-outline" size={20} color={colors.brand.purple} />}
          />
          {error ? (
            <Text style={{ color: colors.status.error, fontSize: 13, fontWeight: '600' }}>{error}</Text>
          ) : null}
        </View>
        <View style={{ marginTop: 'auto', paddingTop: 24, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
          <GradientButton title={t('common.next')} onPress={onNext} loading={loading} />
        </View>
      </View>
    </Screen>
  );
}
