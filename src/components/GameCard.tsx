import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import type { Game } from '../api/types';
import { colors, gradient } from '../theme/tokens';
import { getGameImage } from '../theme/assets';

interface Props {
  game: Game;
  /** Optional live-players counter to show next to the game. */
  playersOnline?: number;
  onJoin?: () => void;
  loading?: boolean;
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  free_fire: 'flame',
  valorant: 'aperture',
  pubg_mobile: 'shield',
  mobile_legends: 'planet',
  cod_mobile: 'rocket',
};

const CARD_HEIGHT = 96;
const IMAGE_WIDTH = 96;
const CARD_RADIUS = 18;

export function GameCard({ game, playersOnline = 0, onJoin, loading }: Props) {
  const { t } = useTranslation();
  const disabled = game.status === 'coming_soon';
  const image = getGameImage(game.id);
  const fallbackIcon = ICONS[game.id] ?? 'game-controller';

  return (
    <Card padding={0} radius={CARD_RADIUS}>
      <View style={{ flexDirection: 'row', height: CARD_HEIGHT }}>
        {/* Left thumbnail — full card height, flush with the card edge */}
        <View
          style={{
            width: IMAGE_WIDTH,
            height: CARD_HEIGHT,
            backgroundColor: '#1A1230',
            // Match only the left corners so the image hugs the card edge.
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
          {/* Top-left status icon overlay */}
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
            <Ionicons
              name={disabled ? 'time' : 'flash'}
              size={13}
              color="white"
            />
          </View>
        </View>

        {/* Right content */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 10,
            justifyContent: 'space-between',
          }}
        >
          {/* Title row + status pill */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
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
              <Text
                style={{
                  color: colors.ink.secondary,
                  fontSize: 11,
                  fontWeight: '500',
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {disabled
                  ? t('common.comingSoon')
                  : t('home.gameCardQueue', { count: playersOnline })}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: disabled ? colors.ink.disabled : colors.status.success,
                  shadowColor: disabled ? 'transparent' : colors.status.success,
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                }}
              />
              <Text
                style={{
                  color: disabled ? colors.ink.disabled : colors.status.success,
                  fontSize: 10,
                  fontWeight: '700',
                }}
              >
                {disabled ? t('common.soon') : t('common.active')}
              </Text>
            </View>
          </View>

          {/* Join button — sits below the title, right of the image */}
          <Pressable
            onPress={disabled ? undefined : onJoin}
            disabled={disabled || loading}
            style={({ pressed }) => [
              {
                alignSelf: 'stretch',
                borderRadius: 11,
                overflow: 'hidden',
                opacity: disabled ? 0.4 : 1,
                shadowColor: '#7B3FF2',
                shadowOpacity: disabled ? 0 : 0.45,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: disabled ? 0 : 8,
              },
              pressed && !disabled ? { transform: [{ scale: 0.98 }] } : null,
            ]}
          >
            <LinearGradient
              colors={
                disabled
                  ? ['#3A3A4A', '#3A3A4A', '#3A3A4A']
                  : gradient.primary
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!disabled ? (
                <LinearGradient
                  colors={['rgba(255,255,255,0.30)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '55%',
                  }}
                  pointerEvents="none"
                />
              ) : null}
              <Text
                style={{
                  color: 'white',
                  fontWeight: '800',
                  fontSize: 13,
                  letterSpacing: 0.3,
                }}
              >
                {disabled ? t('common.comingSoon') : t('home.join')}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
