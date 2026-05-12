import React from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradient } from '../../theme/tokens';
import { APP_LOGO } from '../../theme/assets';
import { WordmarkPartybond } from './WordmarkPartybond';

interface Props {
  /** Pixel size of the mark (the "P" square / image). Default 36. */
  size?: number;
  /** Show the "Partybond" wordmark next to the mark. */
  showText?: boolean;
  /** When true, render the mark only with no shadow halo. */
  noGlow?: boolean;
}

/**
 * App logo:
 *  - Mark on the left: image (when APP_LOGO is set) or gradient "P" fallback.
 *  - Wordmark on the right: italic gradient "PARTYBOND".
 */
export function Logo({ size = 36, showText = true, noGlow = false }: Props) {
  const Mark = APP_LOGO ? (
    <View
      style={
        noGlow
          ? undefined
          : {
              shadowColor: '#7B3FF2',
              shadowOpacity: 0.6,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 4 },
              elevation: 10,
            }
      }
    >
      <Image source={APP_LOGO} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  ) : (
    <LinearGradient
      colors={gradient.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#7B3FF2',
        shadowOpacity: noGlow ? 0 : 0.55,
        shadowRadius: noGlow ? 0 : 14,
        shadowOffset: { width: 0, height: 4 },
        elevation: noGlow ? 0 : 8,
      }}
    >
      <Text style={{ color: 'white', fontWeight: '900', fontSize: size * 0.55 }}>P</Text>
    </LinearGradient>
  );

  // Wordmark — italic gradient "PARTYBOND".
  const wordSize = Math.max(14, size * 0.6);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {Mark}
      {showText ? (
        <View style={{ marginLeft: 8 }}>
          <WordmarkPartybond size={wordSize} />
        </View>
      ) : null}
    </View>
  );
}
