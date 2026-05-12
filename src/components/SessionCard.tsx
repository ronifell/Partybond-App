import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import type { SessionSummary } from '../api/types';
import { colors, gradient } from '../theme/tokens';
import { getGameImage } from '../theme/assets';

interface Props {
  session: SessionSummary;
  onJoin?: () => void;
}

function minutesUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60000));
}

/** Small stack of placeholder avatar bubbles + overflow counter. */
function WaitingStack({ count }: { count: number }) {
  if (count <= 0) return null;
  const visible = Math.min(count, 3);
  const overflow = Math.max(0, count - 3);
  // Brand-coloured tints for each bubble for visual variety
  const tints = ['#FF4DA6', '#7B3FF2', '#00D1FF'];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {Array.from({ length: visible }, (_, i) => (
        <View
          key={i}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#11091F',
            marginLeft: i === 0 ? 0 : -8,
            backgroundColor: tints[i % tints.length],
            shadowColor: tints[i % tints.length],
            shadowOpacity: 0.5,
            shadowRadius: 6,
          }}
        />
      ))}
      {overflow > 0 ? (
        <View
          style={{
            height: 24,
            paddingHorizontal: 8,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#11091F',
            marginLeft: -8,
            backgroundColor: 'rgba(255,255,255,0.10)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>+{overflow}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function SessionCard({ session, onJoin }: Props) {
  const { t } = useTranslation();
  const minutes = minutesUntil(session.scheduledAt);
  const isLive = session.status === 'active' || minutes === 0;
  const gameImage = getGameImage(session.gameId);

  return (
    <Card padding={0} radius={22} style={{ overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', padding: 14, gap: 14 }}>
        {/* Left: game thumbnail */}
        <View
          style={{
            width: 92,
            height: 110,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: '#1A1230',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
          }}
        >
          {gameImage ? (
            <Image source={gameImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="game-controller" size={36} color="white" />
            </LinearGradient>
          )}
          {/* Bottom-right glyph overlay (mode marker) */}
          <View
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: 'rgba(123, 63, 242, 0.85)',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#7B3FF2',
              shadowOpacity: 0.6,
              shadowRadius: 6,
            }}
          >
            <Ionicons
              name={
                session.gameMode === 'competitive'
                  ? 'trophy'
                  : isLive
                    ? 'radio-button-on'
                    : 'time'
              }
              size={15}
              color="white"
            />
          </View>
        </View>

        {/* Right: content */}
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          {/* Top row — title + status */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text
                style={{
                  color: 'white',
                  fontSize: 17,
                  fontWeight: '800',
                  letterSpacing: -0.2,
                }}
                numberOfLines={1}
              >
                {session.title}
              </Text>
              <Text
                style={{
                  color: colors.ink.secondary,
                  fontSize: 12,
                  fontWeight: '500',
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {session.gameName} · {t(`createSession.${session.gameMode}`)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: isLive ? colors.status.success : colors.brand.purple,
                    shadowColor: isLive ? colors.status.success : colors.brand.purple,
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                  }}
                />
                <Text
                  style={{
                    color: isLive ? colors.status.success : colors.brand.purple,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {isLive ? t('common.active') : t('home.startsIn', { minutes })}
                </Text>
              </View>
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '800',
                  marginTop: 4,
                }}
              >
                <Text style={{ color: colors.brand.pink }}>{session.waitingCount}</Text>
                <Text style={{ color: colors.ink.secondary }}> / {session.playersNeeded}</Text>
              </Text>
            </View>
          </View>

          {/* Players row */}
          <View style={{ marginTop: 6 }}>
            <WaitingStack count={session.waitingCount} />
          </View>
        </View>
      </View>

      {/* Bottom CTA — full width gradient bar */}
      <Pressable
        onPress={onJoin}
        style={({ pressed }) => [
          {
            marginHorizontal: 14,
            marginBottom: 14,
            borderRadius: 14,
            overflow: 'hidden',
            shadowColor: '#7B3FF2',
            shadowOpacity: 0.55,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 10,
          },
          pressed ? { transform: [{ scale: 0.985 }] } : null,
        ]}
      >
        <LinearGradient
          colors={gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 46,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Top sheen */}
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
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 }}>
            {t('home.join')}
          </Text>
        </LinearGradient>
      </Pressable>
    </Card>
  );
}

