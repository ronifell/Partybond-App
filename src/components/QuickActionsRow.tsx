import React from 'react';
import { View, Pressable, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { gradient } from '../theme/tokens';

interface Action {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  /** When true, render with the brand gradient as a primary CTA tile. */
  primary?: boolean;
}

interface Props {
  actions: ReadonlyArray<Action>;
}

export function QuickActionsRow({ actions }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {actions.map((a, i) => (
        <ActionTile key={`${a.label}-${i}`} action={a} />
      ))}
    </View>
  );
}

function ActionTile({ action }: { action: Action }) {
  const inner = (
    <View
      style={{
        height: 86,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 4,
      }}
    >
      <Ionicons name={action.icon} size={22} color="white" />
      <Text
        style={{
          color: 'white',
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {action.label}
      </Text>
    </View>
  );

  if (action.primary) {
    return (
      <Pressable
        onPress={action.onPress}
        style={({ pressed }) => [
          {
            flex: 1,
            borderRadius: 18,
            overflow: 'hidden',
            shadowColor: '#7B3FF2',
            shadowOpacity: 0.55,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 10,
          },
          pressed ? { transform: [{ scale: 0.97 }] } : null,
        ]}
      >
        <LinearGradient
          colors={gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 18 }}
        >
          {/* Top sheen */}
          <LinearGradient
            colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '55%',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
            }}
            pointerEvents="none"
          />
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={action.onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.12)',
        },
        pressed ? { transform: [{ scale: 0.97 }] } : null,
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 18}
        tint="dark"
        style={{ borderRadius: 18 }}
      >
        <View style={{ backgroundColor: 'rgba(10, 10, 18, 0.92)' }}>
          {/* Top sheen */}
          <LinearGradient
            colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '55%',
            }}
            pointerEvents="none"
          />
          {inner}
        </View>
      </BlurView>
    </Pressable>
  );
}

