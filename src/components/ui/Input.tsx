import React, { useEffect, useRef, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  Animated,
  Easing,
  Pressable,
  Platform,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradient } from '../../theme/tokens';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  /** Optional element shown on the right (e.g. dropdown caret). */
  rightSlot?: React.ReactNode;
  /** When true and `secureTextEntry` is set, show an eye toggle on the right. */
  passwordToggle?: boolean;
  /** Tighter vertical padding and height (e.g. create session title). */
  compact?: boolean;
}

/**
 * Pill-rounded input matching the Partybond design system:
 * - Persistent brand-purple border (idle)
 * - Animated bright gradient ring on focus + soft purple halo
 * - Top sheen + bottom accent that lights up on focus
 * - Left icon slot (mail / lock / person etc.)
 * - Optional password eye toggle or custom right slot
 * - alignSelf: 'stretch' so it always fills its flex parent
 */
export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightSlot,
  passwordToggle,
  secureTextEntry,
  compact,
  style,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const multiline = !!rest.multiline;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [focused, focusAnim]);

  const haloOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.6],
  });

  const isSecure = !!secureTextEntry && !showPassword;
  const minH = multiline ? 100 : compact ? 44 : 58;
  const padV = multiline ? (Platform.OS === 'ios' ? 12 : 10) : compact ? (Platform.OS === 'ios' ? 10 : 8) : Platform.OS === 'ios' ? 18 : 14;
  const fontSize = compact ? 15 : 16;

  return (
    <View style={{ alignSelf: 'stretch', width: '100%' }}>
      {label ? (
        <Text
          style={{
            color: focused ? colors.brand.purple : colors.ink.secondary,
            marginBottom: 10,
            marginLeft: 4,
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={{
          borderRadius: 16,
          shadowColor: colors.brand.purple,
          shadowOpacity: haloOpacity,
          shadowRadius: focused ? 20 : 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: focused ? 10 : 0,
        }}
      >
        <View style={{ position: 'relative', borderRadius: 16 }}>
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -1.5,
              left: -1.5,
              right: -1.5,
              bottom: -1.5,
              borderRadius: 17.5,
              opacity: focusAnim,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, borderRadius: 17.5 }}
            />
          </Animated.View>

          <View
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 1.5,
              borderColor: error
                ? colors.status.error
                : focused
                  ? 'transparent'
                  : 'rgba(123, 63, 242, 0.55)',
              backgroundColor: '#11091F',
              minHeight: minH,
              flexDirection: 'row',
              alignItems: multiline ? 'flex-start' : 'center',
            }}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 28,
              }}
              pointerEvents="none"
            />

            {leftIcon ? (
              <View style={{ paddingLeft: 16, paddingRight: 4, paddingTop: multiline ? (Platform.OS === 'ios' ? 14 : 12) : 0 }}>
                {leftIcon}
              </View>
            ) : null}

            <TextInput
              {...rest}
              secureTextEntry={isSecure}
              placeholderTextColor={'rgba(184,184,204,0.55)'}
              onFocus={(e) => {
                setFocused(true);
                rest.onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                rest.onBlur?.(e);
              }}
              selectionColor={colors.brand.purple}
              cursorColor={colors.brand.purple}
              style={[
                {
                  flex: 1,
                  alignSelf: 'stretch',
                  color: colors.ink.primary,
                  paddingHorizontal: leftIcon ? 12 : 18,
                  paddingVertical: padV,
                  fontSize,
                  fontWeight: '500',
                  letterSpacing: 0.2,
                },
                style,
              ]}
            />

            {passwordToggle && secureTextEntry ? (
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={10}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.ink.secondary}
                />
              </Pressable>
            ) : rightSlot ? (
              <View style={{ paddingRight: 14, paddingLeft: 4 }}>{rightSlot}</View>
            ) : null}
          </View>
        </View>
      </Animated.View>

      {error ? (
        <Text
          style={{
            color: colors.status.error,
            marginTop: 8,
            marginLeft: 4,
            fontSize: 12,
            fontWeight: '600',
          }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text style={{ color: colors.ink.disabled, marginTop: 8, marginLeft: 4, fontSize: 12 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
