import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { gradient, colors } from '../theme/tokens';

interface Props {
  current: number;
  total: number;
  title: string;
  subtitle?: string;
}

export function OnboardingHeader({ current, total, title, subtitle }: Props) {
  const { t } = useTranslation();
  const segments = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View style={{ marginBottom: 28 }}>
      {/* Progress bar */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 22 }}>
        {segments.map((i) => {
          const active = i <= current;
          if (!active) {
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.10)',
                }}
              />
            );
          }
          return (
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
                shadowOpacity: 0.6,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
              }}
            />
          );
        })}
      </View>

      <Text
        style={{
          color: colors.ink.secondary,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {t('onboarding.step', { current, total })}
      </Text>
      <Text
        style={{
          color: colors.ink.primary,
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: -0.5,
          lineHeight: 34,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            color: colors.ink.secondary,
            fontSize: 15,
            fontWeight: '400',
            lineHeight: 22,
            marginTop: 8,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
