import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { OnboardingHeader } from '../components/OnboardingHeader';
import { useAuth } from '../store/authStore';
import { updateProfile } from '../api/users';
import { getApiError } from '../api/client';

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
    if (!name.trim() || !ageNum || ageNum < 13) {
      setError(t('auth.errors.generic'));
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
    <Screen scroll keyboard>
      <BackgroundGlow />
      <View className="flex-1 py-4">
        <OnboardingHeader
          current={1}
          total={4}
          title={t('onboarding.step1Title')}
          subtitle={t('onboarding.step1Subtitle')}
        />
        <View className="gap-4">
          <Input label={t('auth.name')} value={name} onChangeText={setName} placeholder={t('auth.namePlaceholder')} />
          <Input
            label={t('auth.age')}
            value={age}
            onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder={t('auth.agePlaceholder')}
          />
          {error ? <Text className="text-status-error text-sm">{error}</Text> : null}
        </View>
        <View className="mt-auto pt-8">
          <GradientButton title={t('common.next')} onPress={onNext} loading={loading} />
        </View>
      </View>
    </Screen>
  );
}
