import React from 'react';
import { Pressable, Text, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { gradient, colors } from '../../theme/tokens';

interface Props {
  label: string;
  onPress?: () => void;
  selected?: boolean;
}

export function QuickActionChip({ label, onPress, selected }: Props) {
  if (selected) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          borderRadius: 999,
          overflow: 'hidden',
          shadowColor: '#7B3FF2',
          shadowOpacity: 0.5,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
          ...(pressed ? { transform: [{ scale: 0.97 }] } : null),
        })}
      >
        <LinearGradient
          colors={gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, height: 40, justifyContent: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 }}>
            {label}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: pressed ? colors.glass.borderStrong : colors.glass.border,
        ...(pressed ? { transform: [{ scale: 0.97 }] } : null),
      })}
    >
      <BlurView
        intensity={Platform.OS === 'android' ? 50 : 25}
        tint="dark"
        style={{ borderRadius: 999 }}
      >
        <View
          style={{
            backgroundColor: colors.glass.surface,
            paddingHorizontal: 16,
            height: 40,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 0.2 }}>
            {label}
          </Text>
        </View>
      </BlurView>
    </Pressable>
  );
}
