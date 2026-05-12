import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from './ui/Logo';

interface Props {
  /** Optional unread notifications count to show as a badge. */
  notifications?: number;
  onNotificationsPress?: () => void;
}

export function HeaderBar({ notifications = 0, onNotificationsPress }: Props) {
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

      <Pressable
        onPress={onNotificationsPress}
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
        <Ionicons name="notifications-outline" size={20} color="white" />
        {notifications > 0 ? (
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
              {notifications > 99 ? '99+' : notifications}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
