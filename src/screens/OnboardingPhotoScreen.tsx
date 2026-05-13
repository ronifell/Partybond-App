import React, { useState } from 'react';
import { View, Pressable, Image, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { GradientButton } from '../components/ui/GradientButton';
import { OnboardingHeader } from '../components/OnboardingHeader';
import { OnboardingBackBar } from '../components/OnboardingBackBar';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../store/authStore';
import { uploadProfilePhoto } from '../api/users';
import { getApiError } from '../api/client';

export function OnboardingPhotoScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const [localUri, setLocalUri] = useState<string | null>(user?.photoUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalUri(result.assets[0].uri);
    }
  };

  const onNext = async () => {
    setError(null);
    if (!localUri) {
      navigation.navigate('OnboardingGame');
      return;
    }
    if (localUri.startsWith('http')) {
      navigation.navigate('OnboardingGame');
      return;
    }
    setLoading(true);
    try {
      const updated = await uploadProfilePhoto(localUri);
      setUser(updated);
      navigation.navigate('OnboardingGame');
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded={false} onboardingArt>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
        <OnboardingBackBar navigation={navigation} />
        <OnboardingHeader
          current={2}
          total={4}
          title={t('onboarding.step2Title')}
          subtitle={t('onboarding.step2Subtitle')}
        />

        <View className="items-center justify-center my-8">
          <Pressable onPress={pick} className="active:opacity-80">
            {localUri ? (
              <View
                style={{
                  shadowColor: '#7B3FF2',
                  shadowOpacity: 0.5,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Image
                  source={{ uri: localUri }}
                  style={{ width: 180, height: 180, borderRadius: 90, borderWidth: 3, borderColor: '#7B3FF2' }}
                />
              </View>
            ) : (
              <Avatar size={160} name={user?.name} />
            )}
          </Pressable>
        </View>

        {error ? <Text className="text-status-error text-sm mb-3">{error}</Text> : null}

        <View
          style={{
            marginTop: 'auto',
            paddingTop: 8,
            gap: 20,
            width: '100%',
            maxWidth: 400,
            alignSelf: 'center',
          }}
        >
          <View style={{ marginBottom: 4 }}>
            <GradientButton title={t('onboarding.step2Pick')} onPress={pick} variant="secondary" />
          </View>
          <GradientButton
            title={localUri ? t('common.next') : t('onboarding.step2Skip')}
            onPress={onNext}
            loading={loading}
          />
        </View>
      </View>
    </Screen>
  );
}
