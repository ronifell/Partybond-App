import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/tokens';

interface LegalConsentRowProps {
  checked: boolean;
  onToggle: () => void;
  prefix: string;
  linkLabel: string;
  suffix?: string;
  onOpenLink: () => void;
}

/**
 * Checkbox row used on the registration screen — user must tick before signing up.
 * The linked label opens the legal document in the system browser.
 */
export function LegalConsentRow({
  checked,
  onToggle,
  prefix,
  linkLabel,
  suffix = '',
  onOpenLink,
}: LegalConsentRowProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, paddingTop: 1 })}
      >
        <Ionicons
          name={checked ? 'checkbox' : 'square-outline'}
          size={22}
          color={checked ? colors.brand.purple : colors.ink.secondary}
        />
      </Pressable>
      <Text
        style={{
          flex: 1,
          color: colors.ink.secondary,
          fontSize: 13,
          lineHeight: 19,
        }}
      >
        {prefix}
        <Text
          onPress={onOpenLink}
          suppressHighlighting
          style={{
            color: colors.brand.pink,
            fontWeight: '700',
            textDecorationLine: 'underline',
          }}
        >
          {linkLabel}
        </Text>
        {suffix}
      </Text>
    </View>
  );
}
