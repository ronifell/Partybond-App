import React from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { gradient } from '../../theme/tokens';

interface Props {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  bottom?: number;
  right?: number;
}

export function FloatingActionButton({
  onPress,
  icon = 'add',
  size = 64,
  bottom = 32,
  right = 24,
}: Props) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom,
        right,
        shadowColor: '#7B3FF2',
        shadowOpacity: 0.6,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 8 },
        elevation: 16,
      }}
      pointerEvents="box-none"
    >
      {/* outer halo ring */}
      <View
        style={{
          position: 'absolute',
          top: -3,
          left: -3,
          right: -3,
          bottom: -3,
          borderRadius: (size + 6) / 2,
          borderWidth: 1.2,
          borderColor: 'rgba(255,255,255,0.18)',
        }}
        pointerEvents="none"
      />
      <Pressable
        onPress={onPress}
        style={({ pressed }) =>
          pressed ? { transform: [{ scale: 0.94 }] } : null
        }
      >
        <LinearGradient
          colors={gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={size * 0.5} color="white" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}
