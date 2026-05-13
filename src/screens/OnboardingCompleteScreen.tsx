import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { GradientButton } from '../components/ui/GradientButton';
import { useOnboarding } from '../store/onboardingStore';
import { colors, gradient } from '../theme/tokens';

const FLOWERS = ['🌸', '🌺', '🌼', '🌷', '💐', '🪷', '🏵️', '🌹'];

type FlowerNode = {
  key: string;
  left: number;
  delay: number;
  duration: number;
  char: string;
  fontSize: number;
  rotate: string;
};

function FallingFlower({
  node,
  screenH,
}: {
  node: FlowerNode;
  screenH: number;
}) {
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(node.delay),
        Animated.timing(translateY, {
          toValue: screenH + 80,
          duration: node.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -50,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [node.delay, node.duration, screenH, translateY]);

  return (
    <Animated.Text
      style={[
        styles.flower,
        {
          left: node.left,
          fontSize: node.fontSize,
          transform: [{ translateY }, { rotate: node.rotate }],
        },
      ]}
    >
      {node.char}
    </Animated.Text>
  );
}

function FlowerShower() {
  const { width: W, height: H } = Dimensions.get('window');
  const nodes = useMemo((): FlowerNode[] => {
    const count = 26;
    return Array.from({ length: count }, (_, i) => ({
      key: `f-${i}`,
      left: W * (0.04 + Math.random() * 0.92),
      delay: Math.floor(Math.random() * 2200),
      duration: 5200 + Math.floor(Math.random() * 2800),
      char: FLOWERS[i % FLOWERS.length],
      fontSize: 15 + Math.floor(Math.random() * 9),
      rotate: `${Math.floor(Math.random() * 50 - 25)}deg`,
    }));
  }, [W]);

  return (
    <View style={styles.showerRoot} pointerEvents="none">
      {nodes.map((node) => (
        <FallingFlower key={node.key} node={node} screenH={H} />
      ))}
    </View>
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
      <View style={{ flex: 1 }}>
        <FlowerShower />
        <View style={styles.foreground}>
          <View style={styles.progressRow}>
            {[0, 1, 2, 3].map((i) => (
              <LinearGradient
                key={i}
                colors={gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressSeg}
              />
            ))}
          </View>

          <View style={styles.centerBlock}>
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconRing}
              >
                <View style={styles.iconInner}>
                  <Ionicons name="checkmark" size={58} color={colors.brand.purple} />
                </View>
              </LinearGradient>
            </View>

            <Text style={styles.title}>{t('onboarding.completeTitle')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.completeSubtitle')}</Text>
          </View>

          <View style={styles.footer}>
            <GradientButton title={t('onboarding.completeCta')} onPress={onLetsPlay} />
            <Text style={styles.hint}>{t('onboarding.completeHint')}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  showerRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
  flower: {
    position: 'absolute',
    top: 0,
    opacity: 0.92,
    zIndex: 0,
  } satisfies TextStyle,
  foreground: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 280,
    marginBottom: 8,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    shadowColor: '#7B3FF2',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  centerBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconWrap: {
    position: 'relative',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRing: {
    width: 124,
    height: 124,
    borderRadius: 62,
    padding: 4,
    shadowColor: '#7B3FF2',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  iconInner: {
    flex: 1,
    borderRadius: 58,
    backgroundColor: '#0A0814',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.ink.primary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 36,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.ink.secondary,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    maxWidth: 340,
  },
  footer: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  hint: {
    color: colors.ink.disabled,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
});
