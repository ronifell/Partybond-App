import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { Avatar } from '../components/ui/Avatar';
import { updateProfile, uploadProfilePhoto, type ProfilePhotoUploadMeta } from '../api/users';
import { useAuth } from '../store/authStore';
import { getApiError } from '../api/client';
import { colors } from '../theme/tokens';

export function EditProfileScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);

  const [name, setName] = useState(user?.name ?? '');
  const [email] = useState(user?.email ?? '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [photoMeta, setPhotoMeta] = useState<ProfilePhotoUploadMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickPhoto = async () => {
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
      setLocalPhotoUri(a.uri);
      setPhotoMeta({
        mimeType: a.mimeType ?? null,
        fileName: a.fileName ?? null,
      });
    }
  };

  const onSave = async () => {
    const ageNum = Number(age);
    if (!name.trim() || !ageNum || ageNum < 13) {
      setError(t('auth.errors.generic'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (localPhotoUri) {
        const photoUpdated = await uploadProfilePhoto(localPhotoUri, photoMeta ?? undefined);
        setUser(photoUpdated);
      }

      const updated = await updateProfile({ name: name.trim(), age: ageNum });
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
          {t('profile.editProfile')}
        </Text>
      </View>

      {/* Photo */}
      <View style={{ alignItems: 'center', marginBottom: 28 }}>
        <Pressable
          onPress={pickPhoto}
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
            position: 'relative',
          })}
        >
          {localPhotoUri ? (
            <View
              style={{
                shadowColor: '#7B3FF2',
                shadowOpacity: 0.5,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Image
                source={{ uri: localPhotoUri }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 3,
                  borderColor: '#7B3FF2',
                }}
              />
            </View>
          ) : (
            <Avatar size={110} name={user?.name} uri={user?.photoUrl} />
          )}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.brand.purple,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: '#070710',
            }}
          >
            <Ionicons name="camera" size={16} color="white" />
          </View>
        </Pressable>
        <Pressable onPress={pickPhoto} style={{ marginTop: 10 }}>
          <Text style={{ color: colors.brand.purple, fontSize: 13, fontWeight: '700' }}>
            {t('profile.changePhoto')}
          </Text>
        </Pressable>
      </View>

      {/* Fields */}
      <View style={{ gap: 16, marginBottom: 24 }}>
        <Input
          label={t('auth.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('auth.namePlaceholder')}
          leftIcon={<Ionicons name="person-outline" size={20} color={colors.brand.purple} />}
        />
        <Input
          label={t('auth.email')}
          value={email}
          editable={false}
          placeholder={t('auth.emailPlaceholder')}
          leftIcon={<Ionicons name="mail-outline" size={20} color={colors.brand.purple} />}
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
          <Text style={{ color: colors.status.error, fontSize: 13, fontWeight: '600' }}>
            {error}
          </Text>
        ) : null}
      </View>

      <GradientButton title={t('common.save')} onPress={onSave} loading={loading} />
    </Screen>
  );
}
