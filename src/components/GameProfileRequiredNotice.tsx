import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors, gradient } from '../theme/tokens';

interface Props {
  gameName: string;
  onDismiss: () => void;
  onGoToProfile: () => void;
}

/**
 * Inline notice when the user tries to join matchmaking without an in-game profile for that title.
 */
export function GameProfileRequiredNotice({ gameName, onDismiss, onGoToProfile }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        top: insets.top + 100,
        zIndex: 200,
        elevation: 24,
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 77, 166, 0.5)',
          shadowColor: '#FF4DA6',
          shadowOpacity: 0.35,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <LinearGradient
          colors={['rgba(36, 22, 52, 0.98)', 'rgba(14, 12, 24, 0.99)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: 'rgba(255, 77, 166, 0.2)',
                borderWidth: 1,
                borderColor: 'rgba(255, 77, 166, 0.45)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person-add-outline" size={24} color={colors.brand.pink} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text
                  style={{
                    color: colors.ink.primary,
                    fontSize: 16,
                    fontWeight: '800',
                    letterSpacing: -0.2,
                    flex: 1,
                  }}
                >
                  {t('home.joinNeedsProfileTitle')}
                </Text>
                <Pressable
                  onPress={onDismiss}
                  hitSlop={10}
                  style={({ pressed }) => ({
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                  })}
                  accessibilityLabel={t('common.cancel')}
                >
                  <Ionicons name="close" size={20} color={colors.ink.secondary} />
                </Pressable>
              </View>
              <Text style={{ color: colors.ink.secondary, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
                {t('home.joinNeedsProfileBody', { game: gameName })}
              </Text>
              <Text style={{ color: colors.ink.secondary, fontSize: 13, lineHeight: 19, marginTop: 10, opacity: 0.95 }}>
                {t('home.joinNeedsProfileHint')}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onGoToProfile}
            style={({ pressed }) => ({
              marginTop: 16,
              borderRadius: 14,
              overflow: 'hidden',
              opacity: pressed ? 0.92 : 1,
              transform: pressed ? [{ scale: 0.99 }] : undefined,
            })}
          >
            <LinearGradient
              colors={gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="arrow-forward-circle" size={22} color="white" />
              <Text style={{ color: 'white', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 }}>
                {t('home.joinNeedsProfileCta')}
              </Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}
