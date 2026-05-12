import React from 'react';
import { Image, View, Dimensions, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LOGIN_BACKGROUND, LOGIN_BACKGROUND_OVERLAY } from '../../theme/assets';
import {
  AUTH_BACKGROUND_IMAGE,
  AUTH_BACKGROUND_OVERLAY,
} from '../../theme/appBackground';
import { ArenaBackground } from './ArenaBackground';

/**
 * Hero background just for the auth (Login / Register) screens.
 *
 * Resolution order:
 *   1. `LOGIN_BACKGROUND` (theme/assets.ts) — optional override for auth only.
 *   2. `AUTH_BACKGROUND_IMAGE` (theme/appBackground.ts) — default auth art
 *      (`background.png`), separate from the post-login app background.
 *   3. `ArenaBackground` — code-rendered fallback if no image is set.
 */
export function LoginBackground(): React.ReactElement {
  const { width } = useWindowDimensions();
  const screenHeight = Dimensions.get('screen').height;

  const source = LOGIN_BACKGROUND ?? AUTH_BACKGROUND_IMAGE;
  const overlay = LOGIN_BACKGROUND ? LOGIN_BACKGROUND_OVERLAY : AUTH_BACKGROUND_OVERLAY;

  if (!source) {
    return <ArenaBackground />;
  }

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height: screenHeight,
        backgroundColor: '#070710',
        overflow: 'hidden',
      }}
    >
      <Image
        source={source}
        style={{ width, height: screenHeight }}
        resizeMode="cover"
      />
      {overlay > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height: screenHeight,
            backgroundColor: `rgba(7, 7, 16, ${overlay})`,
          }}
        />
      ) : null}
      {/* Subtle pink halo near top */}
      <LinearGradient
        colors={['rgba(255, 77, 166, 0.18)', 'rgba(255, 77, 166, 0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%' }}
      />
      {/* Cyan halo at the bottom */}
      <LinearGradient
        colors={['rgba(0, 209, 255, 0)', 'rgba(0, 209, 255, 0.14)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%' }}
      />
    </View>
  );
}
