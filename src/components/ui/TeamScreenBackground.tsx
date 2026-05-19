import React from 'react';
import { ImageBackground, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TEAM_SCREEN_BACKGROUND } from '../../theme/assets';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Full-screen `team bg.png` with a light gradient scrim so the mesh stays visible
 * while foreground text remains readable.
 */
export function TeamScreenBackground({ children, style }: Props) {
  return (
    <ImageBackground
      source={TEAM_SCREEN_BACKGROUND}
      style={[styles.background, style]}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.48)',
          'rgba(0, 0, 0, 0.22)',
          'rgba(0, 0, 0, 0.30)',
        ]}
        locations={[0, 0.45, 1]}
        style={styles.scrim}
      >
        {children}
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrim: {
    flex: 1,
  },
});
