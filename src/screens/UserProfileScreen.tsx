import React, { useState } from 'react';
import { View, Text, Image, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { GradientButton } from '../components/ui/GradientButton';
import { blockUser, fetchPublicUser, openDirectChat, reportUser } from '../api/social';
import { colors } from '../theme/tokens';

export function UserProfileScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const userId = (route.params as { userId: string }).userId;
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['public-user', userId],
    queryFn: () => fetchPublicUser(userId),
  });

  const onChat = async () => {
    const conv = await openDirectChat(userId);
    navigation.navigate('Chat', { conversationId: conv.id, title: profile?.name });
  };

  const onBlock = () => {
    Alert.alert(t('moderation.blockTitle'), t('moderation.blockConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('moderation.block'),
        style: 'destructive',
        onPress: async () => {
          await blockUser(userId);
          navigation.goBack();
        },
      },
    ]);
  };

  const onReport = () => {
    Alert.alert(t('moderation.reportTitle'), t('moderation.reportConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('moderation.report'),
        onPress: async () => {
          await reportUser(userId, 'other');
          setMenuOpen(false);
        },
      },
    ]);
  };

  if (!profile) {
    return (
      <Screen>
        <Text style={{ color: colors.ink.secondary }}>{t('common.loading')}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={{ color: colors.brand.pink, fontWeight: '700' }}>{t('common.back')}</Text>
      </Pressable>
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        {profile.photoUrl ? (
          <Image source={{ uri: profile.photoUrl }} style={{ width: 96, height: 96, borderRadius: 48 }} />
        ) : (
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#2a2040' }} />
        )}
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', marginTop: 12 }}>{profile.name}</Text>
        <Text style={{ color: profile.isOnline ? '#7CECA1' : colors.ink.secondary, marginTop: 4 }}>
          {profile.isOnline ? t('recent.online') : t('recent.offline')}
        </Text>
        {profile.lookingFor ? (
          <Text style={{ color: colors.ink.secondary, marginTop: 12, textAlign: 'center' }}>
            {profile.lookingFor}
          </Text>
        ) : null}
      </View>
      <View style={{ marginTop: 24, gap: 10 }}>
        <GradientButton title={t('recent.invitePlay')} onPress={() => navigation.navigate('Home')} />
        <GradientButton title={t('chats.title')} variant="secondary" onPress={onChat} />
        <GradientButton
          title={t('recent.addToGroup')}
          variant="secondary"
          onPress={() => navigation.navigate('AddToGroup', { userId, name: profile.name })}
        />
      </View>
      <Pressable onPress={() => setMenuOpen(!menuOpen)} style={{ marginTop: 24, alignItems: 'center' }}>
        <Text style={{ color: colors.ink.secondary, fontSize: 22 }}>•••</Text>
      </Pressable>
      {menuOpen ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          <Pressable onPress={onBlock}>
            <Text style={{ color: '#ff6b8a', textAlign: 'center', fontWeight: '700' }}>
              {t('moderation.block')}
            </Text>
          </Pressable>
          <Pressable onPress={onReport}>
            <Text style={{ color: colors.ink.secondary, textAlign: 'center', fontWeight: '700' }}>
              {t('moderation.report')}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}
