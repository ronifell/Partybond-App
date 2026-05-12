import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_BACKGROUND_IMAGE } from '../../theme/appBackground';

/**
 * Soft neon background glow used across hero screens.
 * Two diagonal radial-ish gradients to give the dark UI life.
 *
 * Automatically disables itself when a custom background image is configured
 * (see `theme/appBackground.ts`) so the two effects don't compete.
 */
export function BackgroundGlow() {
  if (APP_BACKGROUND_IMAGE) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <LinearGradient
        colors={['rgba(255,77,166,0.18)', 'rgba(255,77,166,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: -120, left: -120, width: 320, height: 320, borderRadius: 200 }}
      />
      <LinearGradient
        colors={['rgba(0,209,255,0.16)', 'rgba(0,209,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', bottom: -100, right: -80, width: 280, height: 280, borderRadius: 200 }}
      />
      <LinearGradient
        colors={['rgba(123,63,242,0.14)', 'rgba(123,63,242,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 200, right: -60, width: 220, height: 220, borderRadius: 200 }}
      />
    </View>
  );
}
