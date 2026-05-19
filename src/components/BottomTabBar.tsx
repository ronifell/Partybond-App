import React from 'react';
import { View, Pressable, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { gradient, colors } from '../theme/tokens';

export type TabKey = 'home' | 'sessions' | 'matches' | 'messages' | 'profile';

/** Inner chrome height (excluding safe-area inset). */
export const BOTTOM_TAB_INNER_HEIGHT = 56;

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
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.55,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: -4 },
        elevation: 16,
      }}
    >
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 18}
        tint="dark"
        style={{ width: '100%' }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            backgroundColor: 'rgba(8, 8, 12, 0.96)',
            paddingTop: 6,
            paddingBottom: bottomInset + 4,
            paddingHorizontal: 4,
            minHeight: BOTTOM_TAB_INNER_HEIGHT,
          }}
        >
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
              height: 1,
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
                  paddingVertical: 2,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {isActive ? (
                  <LinearGradient
                    colors={gradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#7B3FF2',
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                    }}
                  >
                    <Ionicons name={tab.icon} size={18} color="white" />
                  </LinearGradient>
                ) : (
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={tab.icon} size={20} color={colors.ink.secondary} />
                  </View>
                )}
                <Text
                  style={{
                    color: isActive ? 'white' : colors.ink.secondary,
                    fontSize: 9,
                    fontWeight: isActive ? '800' : '600',
                    marginTop: 2,
                    letterSpacing: 0.2,
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

/** Total height from screen bottom (inner bar + safe area). */
export function useBottomTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);
  return BOTTOM_TAB_INNER_HEIGHT + bottomInset + 4;
}
