import React from 'react';
import { Pressable, Text, View, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

interface Props {
  provider: 'google' | 'apple';
  onPress?: () => void;
  /** Half-width when sitting next to another OAuth button. */
  half?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Outlined social-login button matching the design reference.
 * (Currently visual-only — wire onPress to your OAuth flow when ready.)
 */
export function OAuthButton({ provider, onPress, half, loading, disabled }: Props) {
  const { t } = useTranslation();

  const config = {
    google: {
      icon: 'logo-google' as const,
      label: t('auth.oauthGoogle'),
      shortLabel: t('auth.oauthGoogleShort'),
      iconColor: '#fff',
    },
    apple: {
      icon: 'logo-apple' as const,
      label: t('auth.oauthApple'),
      shortLabel: t('auth.oauthAppleShort'),
      iconColor: '#fff',
    },
  }[provider];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        flex: half ? 1 : undefined,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: pressed ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.18)',
        opacity: disabled || loading ? 0.55 : 1,
      })}
    >
      <BlurView
        intensity={Platform.OS === 'android' ? 60 : 30}
        tint="dark"
        style={{ borderRadius: 14 }}
      >
        <View
          style={{
            backgroundColor: 'rgba(10, 10, 18, 0.92)',
            height: 50,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name={config.icon} size={18} color={config.iconColor} />
          )}
          <Text
            style={{
              color: 'white',
              fontWeight: '600',
              fontSize: 13,
              letterSpacing: 0.2,
            }}
          >
            {half ? config.shortLabel : config.label}
          </Text>
        </View>
      </BlurView>
    </Pressable>
  );
}
