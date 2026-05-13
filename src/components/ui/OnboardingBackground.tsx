import React from 'react';
import { View, Image, Dimensions, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ONBOARDING_WELCOME_BACKGROUND, ONBOARDING_WELCOME_OVERLAY } from '../../theme/assets';

/**
 * Full-bleed `onboarding.png` behind every onboarding step (welcome through completion).
 */
export function OnboardingBackground(): React.ReactElement {
  const { width } = useWindowDimensions();
  const screenHeight = Dimensions.get('screen').height;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height: screenHeight,
        overflow: 'hidden',
        backgroundColor: '#070710',
      }}
    >
      <Image
        source={ONBOARDING_WELCOME_BACKGROUND}
        style={{ width, height: screenHeight }}
        resizeMode="cover"
      />
      {ONBOARDING_WELCOME_OVERLAY > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height: screenHeight,
            backgroundColor: `rgba(7, 7, 16, ${ONBOARDING_WELCOME_OVERLAY})`,
          }}
        />
      ) : null}
      <LinearGradient
        colors={['rgba(255, 77, 166, 0.12)', 'rgba(255, 77, 166, 0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%' }}
      />
    </View>
  );
}
