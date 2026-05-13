import React from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradient } from '../../theme/tokens';
import { getApiOrigin } from '../../config/env';

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
  glow?: boolean;
}

/**
 * Rewrite photo URLs so they point at the same host/port as `getApiOrigin()` (from
 * `EXPO_PUBLIC_API_URL` / `extra.apiUrl`) instead of whatever host the backend
 * embedded when the photo was uploaded (usually localhost).
 * Local schemes (file, content, …) are returned unchanged.
 */
export function resolvePhotoUri(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  if (
    s.startsWith('file:') ||
    s.startsWith('content:') ||
    s.startsWith('ph://') ||
    s.startsWith('blob:') ||
    s.startsWith('data:')
  ) {
    return s;
  }
  const origin = getApiOrigin().replace(/\/$/, '');
  const toParse = s.startsWith('//') ? `http:${s}` : s;
  if (toParse.startsWith('/')) {
    return `${origin}${toParse}`;
  }
  try {
    const parsed = new URL(toParse);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return s;
    }
    const base = new URL(origin.includes('://') ? origin : `http://${origin}`);
    parsed.protocol = base.protocol;
    parsed.host = base.host;
    return parsed.toString();
  } catch {
    return s;
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
            <Image
              key={resolvedUri}
              source={{ uri: resolvedUri }}
              style={{ width: size, height: size }}
              resizeMode="cover"
            />
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
