import React from 'react';
import { View, Pressable, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { gradient, radii } from '../../theme/tokens';

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<Option<T>>;
}

export function SegmentToggle<T extends string | number>({ value, onChange, options }: Props<T>) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;

        if (selected) {
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  borderRadius: radii.md,
                  overflow: 'hidden',
                  shadowColor: '#7B3FF2',
                  shadowOpacity: 0.5,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 8,
                },
                pressed ? { transform: [{ scale: 0.985 }] } : null,
              ]}
            >
              <LinearGradient
                colors={gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radii.md,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: '700',
                    fontSize: 15,
                    letterSpacing: 0.2,
                  }}
                >
                  {opt.label}
                </Text>
              </LinearGradient>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              {
                flex: 1,
                borderRadius: radii.md,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: pressed ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.16)',
              },
              pressed ? { transform: [{ scale: 0.985 }] } : null,
            ]}
          >
            <BlurView
              intensity={Platform.OS === 'android' ? 60 : 30}
              tint="dark"
              style={{ borderRadius: radii.md }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(28, 26, 48, 0.62)',
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
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
                    height: '60%',
                  }}
                  pointerEvents="none"
                />
                <Text
                  style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 15,
                    letterSpacing: 0.2,
                  }}
                >
                  {opt.label}
                </Text>
              </View>
            </BlurView>
          </Pressable>
        );
      })}
    </View>
  );
}
