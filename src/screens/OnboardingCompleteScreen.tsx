import React from 'react';
import { View, Text, type DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { GradientButton } from '../components/ui/GradientButton';
import { useOnboarding } from '../store/onboardingStore';
import { colors, gradient } from '../theme/tokens';

function ConfettiPiece({
  top,
  bottom,
  left,
  right,
  size,
  color,
  rotate,
}: {
  top?: number;
  bottom?: number;
  left?: DimensionValue;
  right?: DimensionValue;
  size: number;
  color: string;
  rotate: string;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: 2,
        backgroundColor: color,
        top,
        bottom,
        left,
        right,
        transform: [{ rotate }],
        opacity: 0.9,
      }}
    />
  );
}

export function OnboardingCompleteScreen(_props: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const resetOnboarding = useOnboarding((s) => s.reset);

  const onLetsPlay = () => {
    resetOnboarding();
  };

  return (
    <Screen padded={false} onboardingArt>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 32,
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8, width: '100%', maxWidth: 280, marginBottom: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <LinearGradient
              key={i}
              colors={gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                shadowColor: '#7B3FF2',
                shadowOpacity: 0.5,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
              }}
            />
          ))}
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <View style={{ position: 'relative', width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
            <ConfettiPiece top={-6} left="8%" size={8} color="#FF4DA6" rotate="-12deg" />
            <ConfettiPiece top={8} right="6%" size={6} color="#7B3FF2" rotate="18deg" />
            <ConfettiPiece top={48} left="0%" size={5} color="#00D1FF" rotate="8deg" />
            <ConfettiPiece top={56} right="12%" size={7} color="#FF4DA6" rotate="-22deg" />
            <ConfettiPiece bottom={40} left="14%" size={6} color="#00D1FF" rotate="15deg" />
            <ConfettiPiece bottom={4} right="4%" size={8} color="#C5A8FF" rotate="-8deg" />
            <LinearGradient
              colors={gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 124,
                height: 124,
                borderRadius: 62,
                padding: 4,
                shadowColor: '#7B3FF2',
                shadowOpacity: 0.55,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 0 },
                elevation: 12,
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 58,
                  backgroundColor: '#0A0814',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark" size={58} color={colors.brand.purple} />
              </View>
            </LinearGradient>
          </View>

          <Text
            style={{
              color: colors.ink.primary,
              fontSize: 30,
              fontWeight: '800',
              letterSpacing: -0.5,
              marginTop: 36,
              textAlign: 'center',
            }}
          >
            {t('onboarding.completeTitle')}
          </Text>
          <Text
            style={{
              color: colors.ink.secondary,
              fontSize: 15,
              fontWeight: '500',
              lineHeight: 22,
              marginTop: 12,
              textAlign: 'center',
              paddingHorizontal: 16,
              maxWidth: 340,
            }}
          >
            {t('onboarding.completeSubtitle')}
          </Text>
        </View>

        <View style={{ width: '100%', maxWidth: 400, gap: 12 }}>
          <GradientButton title={t('onboarding.completeCta')} onPress={onLetsPlay} />
          <Text
            style={{
              color: colors.ink.disabled,
              fontSize: 12,
              fontWeight: '500',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {t('onboarding.completeHint')}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
