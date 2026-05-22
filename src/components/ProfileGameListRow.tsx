import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { Game, GameProfile } from '../api/types';
import { getGameImage } from '../theme/assets';
import { colors, gradient } from '../theme/tokens';
import { GAME_ICONS, getGameAccent } from '../theme/gameAccents';

const ROW_HEIGHT = 76;
const ROW_RADIUS = 14;
const IMAGE_WIDTH = ROW_HEIGHT;

interface Props {
  game: Game;
  gameProfile: GameProfile | null;
  isDefault: boolean;
  onPress: () => void;
}

export function ProfileGameListRow({ game, gameProfile, isDefault, onPress }: Props) {
  const { t } = useTranslation();
  const accent = getGameAccent(game.id);
  const thumb = getGameImage(game.id);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.outer,
        {
          borderColor: accent.border,
          backgroundColor: accent.glow,
          shadowColor: accent.tagText,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.thumb,
            {
              borderTopLeftRadius: ROW_RADIUS,
              borderBottomLeftRadius: ROW_RADIUS,
            },
          ]}
        >
          {thumb ? (
            <Image source={thumb} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.thumbFallback}
            >
              <Ionicons name={GAME_ICONS[game.id] ?? 'game-controller'} size={30} color="white" />
            </LinearGradient>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.gameName} numberOfLines={1}>
              {game.name}
            </Text>
            {isDefault ? (
              <View style={[styles.badge, styles.defaultBadge]}>
                <Text style={styles.defaultBadgeText}>{t('profile.defaultGameBadge')}</Text>
              </View>
            ) : null}
            {gameProfile ? (
              <View style={[styles.badge, styles.connectedBadge]}>
                <Text style={styles.connectedBadgeText}>{t('profile.connected')}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.fields}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('profile.fieldNickname')}</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {gameProfile?.nickname ?? '—'}
              </Text>
            </View>
            <View style={[styles.fieldRow, { marginTop: 2 }]}>
              <Text style={styles.fieldLabel}>{t('profile.fieldPlayerId')}</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {gameProfile?.playerId ?? '—'}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.ink.secondary}
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: ROW_RADIUS,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
    backgroundColor: '#1A1230',
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
  info: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  gameName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  defaultBadge: {
    backgroundColor: 'rgba(123,63,242,0.22)',
    borderColor: 'rgba(123,63,242,0.55)',
  },
  defaultBadgeText: {
    color: '#D4C4FF',
    fontSize: 9,
    fontWeight: '800',
  },
  connectedBadge: {
    backgroundColor: 'rgba(0,200,83,0.18)',
    borderColor: 'rgba(0,200,83,0.5)',
  },
  connectedBadgeText: {
    color: '#7CECA1',
    fontSize: 9,
    fontWeight: '800',
  },
  fields: {
    marginTop: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    color: colors.ink.secondary,
    fontSize: 10,
    fontWeight: '600',
    width: 58,
  },
  fieldValue: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  chevron: {
    alignSelf: 'center',
    marginRight: 10,
  },
});
