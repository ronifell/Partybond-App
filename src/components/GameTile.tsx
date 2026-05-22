import React from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import type { Game } from '../api/types';
import { gradient, colors } from '../theme/tokens';
import { getGameImage } from '../theme/assets';

interface Props {
  game: Game;
  onPress?: () => void;
  selected?: boolean;
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  free_fire: 'flame',
  elden_ring_nightreign: 'skull',
  valorant: 'aperture',
  cod_mobile: 'rocket',
  league_of_legends: 'trophy',
  fortnite: 'thunderstorm',
  counter_strike_2: 'scan-circle',
  ea_sports_fc_26: 'football',
  minecraft: 'cube',
  roblox: 'shapes',
  pubg_mobile: 'shield',
  mobile_legends: 'planet',
};

/** Match `GameCard` so pick lists look like the home session list. */
const CARD_HEIGHT = 96;
const IMAGE_WIDTH = 96;
const CARD_RADIUS = 18;

export function GameTile({ game, onPress, selected }: Props) {
  const { t } = useTranslation();
  const disabled = game.status === 'coming_soon';
  const image = getGameImage(game.id);
  const fallbackIcon = ICONS[game.id] ?? 'game-controller';

  return (
    <Card
      onPress={disabled ? undefined : onPress}
      glow={!!selected}
      padding={0}
      radius={CARD_RADIUS}
      variant={selected ? 'strong' : 'default'}
      style={{
        opacity: disabled ? 0.6 : 1,
        borderColor: selected ? '#7B3FF2' : undefined,
      }}
    >
      <View style={{ flexDirection: 'row', height: CARD_HEIGHT }}>
        <View
          style={{
            width: IMAGE_WIDTH,
            height: CARD_HEIGHT,
            backgroundColor: '#1A1230',
            borderTopLeftRadius: CARD_RADIUS,
            borderBottomLeftRadius: CARD_RADIUS,
            overflow: 'hidden',
          }}
        >
          {image ? (
            <Image source={image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name={fallbackIcon} size={36} color="white" />
            </LinearGradient>
          )}
          <View
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              width: 24,
              height: 24,
              borderRadius: 7,
              backgroundColor: disabled
                ? 'rgba(107, 107, 128, 0.85)'
                : 'rgba(123, 63, 242, 0.85)',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#7B3FF2',
              shadowOpacity: disabled ? 0 : 0.6,
              shadowRadius: 6,
            }}
          >
            <Ionicons name={disabled ? 'time' : 'flash'} size={13} color="white" />
          </View>
        </View>

        <View
          style={{
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 10,
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '800',
                  letterSpacing: -0.2,
                }}
                numberOfLines={1}
              >
                {game.name}
              </Text>
              <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                {disabled ? (
                  <Badge label={t('common.comingSoon')} variant="scheduled" />
                ) : selected ? (
                  <Badge label={t('games.selected')} variant="active" />
                ) : (
                  <Badge label={t('games.play')} variant="active" />
                )}
              </View>
            </View>
            {!disabled ? (
              <Ionicons name="chevron-forward" size={22} color={colors.ink.secondary} />
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}
