import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { Game, GameProfile } from '../api/types';
import { getGameImage } from '../theme/assets';
import { colors, gradient } from '../theme/tokens';
import { GAME_ICONS, getGameAccent, getGameGlassGradient } from '../theme/gameAccents';

const ROW_HEIGHT = 68;
const IMAGE_WIDTH = ROW_HEIGHT;
/** Parallelogram slant — image follows outer skew; text is counter-skewed. */
const SKEW_DEG = -14;
const COUNTER_SKEW_DEG = 14;
const SKEW_MARGIN_H = 4;

interface Props {
  game: Game;
  gameProfile: GameProfile | null;
  isDefault: boolean;
  onPress: () => void;
}

export function ProfileGameListRow({ game, gameProfile, onPress }: Props) {
  const { t } = useTranslation();
  const accent = getGameAccent(game.id);
  const glassColors = getGameGlassGradient(accent);
  const thumb = getGameImage(game.id);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.outer,
          {
            borderColor: accent.border,
            shadowColor: accent.tagText,
            transform: [{ skewX: `${SKEW_DEG}deg` }],
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <LinearGradient
          colors={[...glassColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.sheen}
          pointerEvents="none"
        />

        <View style={styles.row}>
          <View style={styles.thumb}>
            {thumb ? (
              <Image source={thumb} style={styles.thumbImage} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.thumbFallback}
              >
                <Ionicons name={GAME_ICONS[game.id] ?? 'game-controller'} size={28} color="white" />
              </LinearGradient>
            )}
          </View>

          <View style={[styles.contentSkew, { transform: [{ skewX: `${COUNTER_SKEW_DEG}deg` }] }]}>
            <View style={styles.info}>
              <Text style={styles.gameName} numberOfLines={1}>
                {game.name}
              </Text>
              <Text style={styles.fieldLine} numberOfLines={1}>
                {t('profile.fieldNickname')} {gameProfile?.nickname ?? '—'}
              </Text>
              <Text style={styles.fieldLine} numberOfLines={1}>
                {t('profile.fieldPlayerId')} {gameProfile?.playerId ?? '—'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.55)" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: SKEW_MARGIN_H,
    marginVertical: 3,
  },
  outer: {
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: ROW_HEIGHT,
  },
  thumb: {
    width: IMAGE_WIDTH,
    height: ROW_HEIGHT,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 10, 18, 0.9)',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSkew: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    minWidth: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    gap: 2,
  },
  gameName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  fieldLine: {
    color: colors.ink.secondary,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
});
