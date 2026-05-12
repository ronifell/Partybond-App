import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import type { Game } from '../api/types';
import { gradient, colors } from '../theme/tokens';

interface Props {
  game: Game;
  onPress?: () => void;
  selected?: boolean;
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  free_fire: 'flame',
  valorant: 'aperture',
  pubg_mobile: 'shield',
  mobile_legends: 'planet',
  cod_mobile: 'rocket',
};

export function GameTile({ game, onPress, selected }: Props) {
  const { t } = useTranslation();
  const disabled = game.status === 'coming_soon';
  const icon = ICONS[game.id] ?? 'game-controller';

  return (
    <Card
      onPress={disabled ? undefined : onPress}
      glow={!!selected}
      padding={16}
      radius={20}
      variant={selected ? 'strong' : 'default'}
      style={{
        opacity: disabled ? 0.6 : 1,
        borderColor: selected ? '#7B3FF2' : undefined,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <LinearGradient
          colors={gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
            shadowColor: '#7B3FF2',
            shadowOpacity: 0.45,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Ionicons name={icon} size={28} color="white" />
        </LinearGradient>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.ink.primary,
              fontSize: 17,
              fontWeight: '700',
              letterSpacing: -0.2,
              marginBottom: 6,
            }}
          >
            {game.name}
          </Text>
          {disabled ? (
            <Badge label={t('common.comingSoon')} variant="scheduled" />
          ) : selected ? (
            <Badge label={t('games.selected')} variant="active" />
          ) : (
            <Badge label={t('games.play')} variant="active" />
          )}
        </View>

        {!disabled ? (
          <Ionicons name="chevron-forward" size={22} color={colors.ink.secondary} />
        ) : null}
      </View>
    </Card>
  );
}
