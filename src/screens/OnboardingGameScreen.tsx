import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { BackgroundGlow } from '../components/ui/BackgroundGlow';
import { OnboardingHeader } from '../components/OnboardingHeader';
import { GameTile } from '../components/GameTile';
import { fetchGames } from '../api/games';
import { useOnboarding } from '../store/onboardingStore';

export function OnboardingGameScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const setSelected = useOnboarding((s) => s.setSelectedGameId);
  const { data: games = [], isLoading } = useQuery({ queryKey: ['games'], queryFn: fetchGames });

  const onPick = (gameId: string) => {
    setSelected(gameId);
    navigation.navigate('OnboardingGameInfo', { gameId });
  };

  return (
    <Screen scroll padded={false}>
      <BackgroundGlow />
      <View className="px-5 pt-4 pb-2">
        <OnboardingHeader
          current={3}
          total={4}
          title={t('onboarding.step3Title')}
          subtitle={t('onboarding.step3Subtitle')}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, gap: 12 }}>
        {isLoading ? <Text className="text-ink-secondary">{t('common.loading')}</Text> : null}
        {games.map((g) => (
          <GameTile key={g.id} game={g} onPress={() => onPick(g.id)} />
        ))}
      </ScrollView>
    </Screen>
  );
}
