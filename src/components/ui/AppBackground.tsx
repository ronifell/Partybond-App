import React from 'react';
import { Image, View, Dimensions, useWindowDimensions } from 'react-native';
import {
  APP_BACKGROUND_IMAGE,
  APP_BACKGROUND_OVERLAY,
} from '../../theme/appBackground';

/**
 * Renders the app-wide background image (when configured) plus a dark overlay
 * for text readability. Always painted underneath every screen, sized to the
 * full physical device — including under the status bar and navigation bar
 * (on Android, edge-to-edge is enabled in App.tsx via expo-navigation-bar).
 *
 * We use `Dimensions.get('screen')` for height (full physical screen) so the
 * image bleeds through system bars, and `useWindowDimensions` for width to
 * pick up live orientation changes without a remount.
 *
 * Combined with `resizeMode="stretch"`, this guarantees the entire image is
 * visible AND fills the screen exactly, on any device.
 *
 * Returns null when no image is configured.
 */
export function AppBackground(): React.ReactElement | null {
  const { width } = useWindowDimensions();
  const screenHeight = Dimensions.get('screen').height;

  if (!APP_BACKGROUND_IMAGE) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height: screenHeight,
      }}
    >
      <Image
        source={APP_BACKGROUND_IMAGE}
        style={{ width, height: screenHeight }}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
      />
      {APP_BACKGROUND_OVERLAY > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height: screenHeight,
            backgroundColor: `rgba(10, 10, 18, ${APP_BACKGROUND_OVERLAY})`,
          }}
        />
      ) : null}
    </View>
  );
}
