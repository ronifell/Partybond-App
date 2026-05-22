import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { Game } from '../api/types';
import { getGameImage } from '../theme/assets';
import { colors, gradient } from '../theme/tokens';

type GameAccent = {
  border: string;
  glow: string;
  tagBg: string;
  tagText: string;
};

const DEFAULT_ACCENT: GameAccent = {
  border: 'rgba(123, 63, 242, 0.45)',
  glow: 'rgba(123, 63, 242, 0.14)',
  tagBg: 'rgba(123, 63, 242, 0.22)',
  tagText: '#D4C4FF',
};

const GAME_ACCENTS: Record<string, GameAccent> = {
  cod_mobile: {
    border: 'rgba(255, 193, 7, 0.5)',
    glow: 'rgba(255, 193, 7, 0.1)',
    tagBg: 'rgba(255, 193, 7, 0.18)',
    tagText: '#FFD54F',
  },
  counter_strike_2: {
    border: 'rgba(255, 152, 0, 0.5)',
    glow: 'rgba(255, 152, 0, 0.1)',
    tagBg: 'rgba(255, 152, 0, 0.18)',
    tagText: '#FFB74D',
  },
  ea_sports_fc_26: {
    border: 'rgba(0, 180, 255, 0.5)',
    glow: 'rgba(0, 180, 255, 0.1)',
    tagBg: 'rgba(0, 180, 255, 0.18)',
    tagText: '#81D4FA',
  },
  elden_ring_nightreign: {
    border: 'rgba(180, 140, 255, 0.55)',
    glow: 'rgba(180, 140, 255, 0.12)',
    tagBg: 'rgba(180, 140, 255, 0.2)',
    tagText: '#CE93D8',
  },
  fortnite: {
    border: 'rgba(200, 100, 255, 0.5)',
    glow: 'rgba(200, 100, 255, 0.1)',
    tagBg: 'rgba(200, 100, 255, 0.18)',
    tagText: '#E1BEE7',
  },
  free_fire: {
    border: 'rgba(255, 200, 80, 0.5)',
    glow: 'rgba(255, 200, 80, 0.1)',
    tagBg: 'rgba(255, 200, 80, 0.18)',
    tagText: '#FFE082',
  },
  league_of_legends: {
    border: 'rgba(0, 210, 220, 0.5)',
    glow: 'rgba(0, 210, 220, 0.1)',
    tagBg: 'rgba(0, 210, 220, 0.18)',
    tagText: '#80DEEA',
  },
  minecraft: {
    border: 'rgba(76, 200, 120, 0.5)',
    glow: 'rgba(76, 200, 120, 0.1)',
    tagBg: 'rgba(76, 200, 120, 0.18)',
    tagText: '#A5D6A7',
  },
  roblox: {
    border: 'rgba(255, 100, 120, 0.5)',
    glow: 'rgba(255, 100, 120, 0.1)',
    tagBg: 'rgba(255, 100, 120, 0.18)',
    tagText: '#F48FB1',
  },
};

/** Extra genre/mode pills shown under the primary tag (screenshot-style). */
const GAME_EXTRA_TAGS: Record<string, string[]> = {
  cod_mobile: ['BATTLE ROYALE'],
  free_fire: ['BATTLE ROYALE'],
  fortnite: ['BATTLE ROYALE'],
  pubg_mobile: ['BATTLE ROYALE'],
};

/** Total row height; thumbnail is ~90% of this. */
const ROW_HEIGHT = 64;
const THUMB_SIZE = Math.round(ROW_HEIGHT * 0.9);
const ROW_PADDING_V = (ROW_HEIGHT - THUMB_SIZE) / 2;

const GAME_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
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
};

interface Props {
  game: Game;
  selected: boolean;
  playersActive: number;
  onPress: () => void;
}

export function CreateSquadGameRow({ game, selected, playersActive, onPress }: Props) {
  const { t } = useTranslation();
  const accent = GAME_ACCENTS[game.id] ?? DEFAULT_ACCENT;
  const thumb = getGameImage(game.id);
  const genreKey = `gameProfile.genres.${game.id}`;
  const genreLabel = t(genreKey, { defaultValue: t('gameProfile.genreDefault') });
  const extraTags = GAME_EXTRA_TAGS[game.id] ?? [];
  const borderColor = selected ? colors.brand.purple : accent.border;
  const glowColor = selected ? 'rgba(123, 63, 242, 0.2)' : accent.glow;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor,
          backgroundColor: glowColor,
          opacity: pressed ? 0.92 : 1,
        },
        selected && styles.rowSelected,
      ]}
    >
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
            <Ionicons name={GAME_ICONS[game.id] ?? 'game-controller'} size={24} color="white" />
          </LinearGradient>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.gameName} numberOfLines={1}>
          {game.name}
        </Text>
        <View style={styles.tagRow}>
          <View style={[styles.tag, { backgroundColor: accent.tagBg, borderColor: accent.border }]}>
            <Text style={[styles.tagText, { color: accent.tagText }]}>
              {genreLabel.toUpperCase()}
            </Text>
          </View>
          {extraTags.map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: accent.tagBg, borderColor: accent.border }]}
            >
              <Text style={[styles.tagText, { color: accent.tagText }]}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {t('createSquad.playersActive', { count: playersActive })}
          </Text>
        </View>
      </View>

      <View style={styles.selector}>
        {selected ? (
          <View style={styles.selectorSelected}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        ) : (
          <View style={styles.selectorEmpty} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: ROW_HEIGHT,
    paddingVertical: ROW_PADDING_V,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  rowSelected: {
    shadowColor: '#7B3FF2',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1A1230',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    gap: 4,
    justifyContent: 'center',
  },
  gameName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.status.success,
  },
  statusText: {
    color: colors.ink.secondary,
    fontSize: 10,
    fontWeight: '500',
  },
  selector: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  selectorSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
