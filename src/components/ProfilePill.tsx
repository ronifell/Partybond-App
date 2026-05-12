import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Avatar } from './ui/Avatar';
import { colors } from '../theme/tokens';
import { getGameImage } from '../theme/assets';
import type { User, Game } from '../api/types';

interface Props {
  user: User | null;
  selectedGame: Game | null;
  /** Tap the game pill on the right (changes selected game). */
  onPressGame?: () => void;
  /** Tap the avatar / name (opens profile). */
  onPressProfile?: () => void;
  /** Optional profile metadata to show next to the name. */
  level?: number;
  stars?: number;
}

/**
 * Top profile band on the Home screen — shows the user (avatar, name, level,
 * stars) and the currently-selected game in a tappable pill.
 */
export function ProfilePill({
  user,
  selectedGame,
  onPressGame,
  onPressProfile,
  level = 1,
  stars = 0,
}: Props) {
  const { t } = useTranslation();
  const gameImage = selectedGame ? getGameImage(selectedGame.id) : null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {/* Avatar with online dot */}
      <Pressable
        onPress={onPressProfile}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <Avatar uri={user?.photoUrl} name={user?.name} size={56} />
        <View
          style={{
            position: 'absolute',
            right: 2,
            bottom: 2,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: colors.status.success,
            borderWidth: 2,
            borderColor: '#070710',
            shadowColor: colors.status.success,
            shadowOpacity: 0.7,
            shadowRadius: 5,
          }}
        />
      </Pressable>

      {/* Name + level + stars */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 }}
          numberOfLines={1}
        >
          {user?.name ?? t('common.player')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {/* Level pill */}
          <LinearGradient
            colors={['rgba(123,63,242,0.35)', 'rgba(0,209,255,0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(123,63,242,0.55)',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 11, letterSpacing: 0.3 }}>
              {t('profile.level', { level })}
            </Text>
          </LinearGradient>
          {/* Stars */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="star" size={11} color="#FFD23F" />
            <Text
              style={{
                color: colors.ink.secondary,
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              {stars.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Game pill on the right */}
      {selectedGame ? (
        <Pressable
          onPress={onPressGame}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 6,
            paddingRight: 12,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: 'rgba(123,63,242,0.55)',
            backgroundColor: 'rgba(10, 10, 18, 0.92)',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#1A1230',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {gameImage ? (
              <Image source={gameImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Ionicons name="flame" size={16} color="#FF4DA6" />
            )}
          </View>
          <Text
            style={{ color: 'white', fontWeight: '700', fontSize: 13, letterSpacing: 0.2 }}
            numberOfLines={1}
          >
            {selectedGame.name}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.ink.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}
