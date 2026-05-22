import { Ionicons } from '@expo/vector-icons';

export type GameAccent = {
  border: string;
  glow: string;
  tagBg: string;
  tagText: string;
};

export const DEFAULT_GAME_ACCENT: GameAccent = {
  border: 'rgba(123, 63, 242, 0.45)',
  glow: 'rgba(123, 63, 242, 0.14)',
  tagBg: 'rgba(123, 63, 242, 0.22)',
  tagText: '#D4C4FF',
};

export const GAME_ACCENTS: Record<string, GameAccent> = {
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
  valorant: {
    border: 'rgba(255, 70, 85, 0.5)',
    glow: 'rgba(255, 70, 85, 0.1)',
    tagBg: 'rgba(255, 70, 85, 0.18)',
    tagText: '#FF8A80',
  },
  pubg_mobile: {
    border: 'rgba(255, 167, 38, 0.5)',
    glow: 'rgba(255, 167, 38, 0.1)',
    tagBg: 'rgba(255, 167, 38, 0.18)',
    tagText: '#FFCC80',
  },
  mobile_legends: {
    border: 'rgba(66, 165, 245, 0.5)',
    glow: 'rgba(66, 165, 245, 0.1)',
    tagBg: 'rgba(66, 165, 245, 0.18)',
    tagText: '#90CAF9',
  },
};

export const GAME_EXTRA_TAGS: Record<string, string[]> = {
  cod_mobile: ['BATTLE ROYALE'],
  free_fire: ['BATTLE ROYALE'],
  fortnite: ['BATTLE ROYALE'],
  pubg_mobile: ['BATTLE ROYALE'],
};

export const GAME_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
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

export function getGameAccent(gameId: string): GameAccent {
  return GAME_ACCENTS[gameId] ?? DEFAULT_GAME_ACCENT;
}
