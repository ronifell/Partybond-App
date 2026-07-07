import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from './ui/Logo';
import { colors } from '../theme/tokens';

interface Props {
  /** Optional unread notifications count to show as a badge. */
  notifications?: number;
  onNotificationsPress?: () => void;
  onSupportPress?: () => void;
  onPremiumPress?: () => void;
}

function HeaderIconButton({
  icon,
  emoji,
  iconColor = 'white',
  onPress,
  badge,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  iconColor?: string;
  onPress?: () => void;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(10, 10, 18, 0.92)',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {emoji ? (
        <Text style={{ fontSize: 18, lineHeight: 20 }}>{emoji}</Text>
      ) : icon ? (
        <Ionicons name={icon} size={20} color={iconColor} />
      ) : null}
      {badge != null && badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 5,
            borderRadius: 9,
            backgroundColor: '#FF4DA6',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: '#070710',
            shadowColor: '#FF4DA6',
            shadowOpacity: 0.7,
            shadowRadius: 5,
          }}
        >
          <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function HeaderBar({
  notifications = 0,
  onNotificationsPress,
  onSupportPress,
  onPremiumPress,
}: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingVertical: 8,
      }}
    >
      <Logo size={32} showText />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {onSupportPress ? (
          <HeaderIconButton
            icon="heart"
            iconColor={colors.brand.pink}
            onPress={onSupportPress}
          />
        ) : null}
        {onPremiumPress ? (
          <HeaderIconButton emoji="👑" onPress={onPremiumPress} />
        ) : null}
        <HeaderIconButton
          icon="notifications-outline"
          onPress={onNotificationsPress}
          badge={notifications}
        />
      </View>
    </View>
  );
}
