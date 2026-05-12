import React from 'react';
import { Text, View } from 'react-native';

type Variant = 'active' | 'waiting' | 'scheduled' | 'success' | 'error';

const STYLES: Record<
  Variant,
  { bg: string; text: string; border: string; shadow?: string }
> = {
  active: {
    bg: 'rgba(0, 209, 255, 0.18)',
    border: 'rgba(0, 209, 255, 0.45)',
    text: '#7FE9FF',
    shadow: '#00D1FF',
  },
  waiting: {
    bg: 'rgba(123, 63, 242, 0.20)',
    border: 'rgba(123, 63, 242, 0.45)',
    text: '#C5A8FF',
    shadow: '#7B3FF2',
  },
  scheduled: {
    bg: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.14)',
    text: '#B8B8CC',
  },
  success: {
    bg: 'rgba(0, 200, 83, 0.18)',
    border: 'rgba(0, 200, 83, 0.45)',
    text: '#7CECA1',
  },
  error: {
    bg: 'rgba(255, 82, 82, 0.18)',
    border: 'rgba(255, 82, 82, 0.45)',
    text: '#FFA1A1',
  },
};

export function Badge({
  label,
  variant = 'active',
}: {
  label: string;
  variant?: Variant;
}) {
  const s = STYLES[variant];
  return (
    <View
      style={{
        backgroundColor: s.bg,
        borderColor: s.border,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        alignSelf: 'flex-start',
        shadowColor: s.shadow ?? 'transparent',
        shadowOpacity: s.shadow ? 0.4 : 0,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <Text
        style={{
          color: s.text,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
