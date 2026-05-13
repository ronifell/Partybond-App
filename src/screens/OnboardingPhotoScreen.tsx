import React, { useState } from 'react';
import { View, Pressable, Image, Text, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { GradientButton } from '../components/ui/GradientButton';
import { OnboardingHeader } from '../components/OnboardingHeader';
import { OnboardingBackBar } from '../components/OnboardingBackBar';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../store/authStore';
import { uploadProfilePhoto, type ProfilePhotoUploadMeta } from '../api/users';
import { getApiError } from '../api/client';

export function OnboardingPhotoScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const [localUri, setLocalUri] = useState<string | null>(user?.photoUrl ?? null);
  const [pickedMeta, setPickedMeta] = useState<ProfilePhotoUploadMeta | null>(null);
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
      const a = result.assets[0];
      setLocalUri(a.uri);
      setPickedMeta({
        mimeType: a.mimeType ?? null,
        fileName: a.fileName ?? null,
      });
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
      const updated = await uploadProfilePhoto(localUri, pickedMeta ?? undefined);
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
          <Pressable
            onPress={pick}
            className="active:opacity-80"
            style={{
              width: 196,
              height: 196,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {localUri ? (
              <View
                style={{
                  width: 188,
                  height: 188,
                  borderRadius: 94,
                  padding: 4,
                  backgroundColor: 'rgba(26, 18, 48, 0.95)',
                  shadowColor: '#7B3FF2',
                  shadowOpacity: 0.55,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: Platform.OS === 'android' ? 12 : 0,
                }}
              >
                <Image
                  source={{ uri: localUri }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 90,
                    backgroundColor: '#1A1230',
                  }}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: 'rgba(10, 8, 20, 0.55)',
                  borderRadius: 100,
                  padding: 6,
                }}
              >
                <Avatar size={160} name={user?.name} />
              </View>
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
