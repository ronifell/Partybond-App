import React from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradient } from '../../theme/tokens';
import { API_URL } from '../../config/env';

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
  glow?: boolean;
}

/**
 * Rewrite photo URLs so they point at the API_URL the mobile app actually
 * uses (e.g. 10.0.2.2 on Android) instead of whatever host the backend
 * embedded when the photo was uploaded (usually localhost).
 */
function resolvePhotoUri(raw: string): string {
  try {
    const parsed = new URL(raw);
    const base = new URL(API_URL);
    parsed.protocol = base.protocol;
    parsed.host = base.host;
    return parsed.toString();
  } catch {
    if (raw.startsWith('/')) return `${API_URL}${raw}`;
    return raw;
  }
}

export function Avatar({ uri, name, size = 64, glow = true }: Props) {
  const initials = (name ?? '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const radius = size / 2;
  const border = 2.5;
  const resolvedUri = uri ? resolvePhotoUri(uri) : null;

  return (
    <View
      style={
        glow
          ? {
              shadowColor: '#7B3FF2',
              shadowOpacity: 0.65,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }
          : undefined
      }
    >
      <LinearGradient
        colors={gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size + border * 2,
          height: size + border * 2,
          borderRadius: radius + border,
          padding: border,
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: '#0A0A12',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {resolvedUri ? (
            <Image source={{ uri: resolvedUri }} style={{ width: size, height: size }} resizeMode="cover" />
          ) : (
            <Text
              style={{
                color: 'white',
                fontSize: size / 2.6,
                fontWeight: '800',
                letterSpacing: 0.5,
              }}
            >
              {initials}
            </Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}
