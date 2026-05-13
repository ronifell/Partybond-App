import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { OnboardingHeader } from '../components/OnboardingHeader';
import { OnboardingBackBar } from '../components/OnboardingBackBar';
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
    <Screen scroll={false} padded={false} onboardingArt>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
          <OnboardingBackBar navigation={navigation} />
          <OnboardingHeader
            current={3}
            total={4}
            title={t('onboarding.step3Title')}
            subtitle={t('onboarding.step3Subtitle')}
          />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, gap: 12 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? <Text className="text-ink-secondary">{t('common.loading')}</Text> : null}
          {games.map((g) => (
            <GameTile key={g.id} game={g} onPress={() => onPick(g.id)} />
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}
