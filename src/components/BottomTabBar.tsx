import React from 'react';
import { View, Pressable, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { gradient, colors } from '../theme/tokens';

export type TabKey = 'home' | 'sessions' | 'matches' | 'messages' | 'profile';

interface Tab {
  key: TabKey;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}

interface Props {
  active: TabKey;
  tabs: ReadonlyArray<Tab>;
}

export function BottomTabBar({ active, tabs }: Props) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 16,
        left: 10,
        right: 10,
        borderRadius: 26,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
        elevation: 16,
      }}
    >
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 18}
        tint="dark"
        style={{ borderRadius: 26 }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            backgroundColor: 'rgba(10, 10, 18, 0.92)',
            paddingVertical: 10,
            paddingHorizontal: 6,
          }}
        >
          {/* Top hairline accent */}
          <LinearGradient
            colors={[
              'rgba(255, 77, 166, 0.55)',
              'rgba(123, 63, 242, 0.55)',
              'rgba(0, 209, 255, 0.55)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1.5,
            }}
            pointerEvents="none"
          />

          {tabs.map((tab) => {
            const isActive = tab.key === active;
            return (
              <Pressable
                key={tab.key}
                onPress={tab.onPress}
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 6,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {isActive ? (
                  <LinearGradient
                    colors={gradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#7B3FF2',
                      shadowOpacity: 0.6,
                      shadowRadius: 12,
                    }}
                  >
                    <Ionicons name={tab.icon} size={20} color="white" />
                  </LinearGradient>
                ) : (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={tab.icon} size={22} color={colors.ink.secondary} />
                  </View>
                )}
                <Text
                  style={{
                    color: isActive ? 'white' : colors.ink.secondary,
                    fontSize: 10,
                    fontWeight: isActive ? '800' : '600',
                    marginTop: 4,
                    letterSpacing: 0.3,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
