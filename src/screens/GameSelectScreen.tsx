import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { GameTile } from '../components/GameTile';
import { Logo } from '../components/ui/Logo';
import { fetchGames } from '../api/games';
import { useAuth } from '../store/authStore';
import { updateProfile } from '../api/users';

export function GameSelectScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const { data: games = [], isLoading } = useQuery({ queryKey: ['games'], queryFn: fetchGames });

  const onPick = async (gameId: string) => {
    if (gameId !== user?.selectedGame) {
      try {
        const updated = await updateProfile({ selectedGame: gameId });
        setUser(updated);
      } catch {
        // ignore
      }
    }
    navigation.replace('Home');
  };

  return (
    <Screen padded={false}>
      <BackgroundGlow />
      <View className="px-5 pt-6 pb-2">
        <Logo size={36} />
        <Text className="text-white text-2xl font-bold mt-6 mb-1">{t('games.title')}</Text>
        <Text className="text-ink-secondary mb-4">{t('onboarding.step3Subtitle')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32, gap: 12 }}>
        {isLoading ? <Text className="text-ink-secondary">{t('common.loading')}</Text> : null}
        {games.map((g) => (
          <GameTile
            key={g.id}
            game={g}
            selected={g.id === user?.selectedGame}
            onPress={() => onPick(g.id)}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}
