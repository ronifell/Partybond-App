import React from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  Platform,
  type PressableProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { gradient, colors, radii } from '../../theme/tokens';

interface Props extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  /** Optional left adornment (icon). */
  leftAdornment?: React.ReactNode;
}

const SIZE = {
  sm: { height: 40, padX: 16, fontSize: 14, radius: radii.md },
  md: { height: 48, padX: 20, fontSize: 15, radius: radii.md },
  lg: { height: 56, padX: 24, fontSize: 16, radius: radii.lg },
};

export function GradientButton({
  title,
  loading,
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  leftAdornment,
  disabled,
  ...rest
}: Props) {
  const isDisabled = !!disabled || !!loading;
  const s = SIZE[size];

  const renderInner = () => (
    <View
      style={{
        height: s.height,
        paddingHorizontal: s.padX,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {leftAdornment}
          <Text
            style={{
              color: '#fff',
              fontSize: s.fontSize,
              fontWeight: '700',
              letterSpacing: 0.2,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        {...rest}
        disabled={isDisabled}
        style={({ pressed }) => [
          {
            width: fullWidth ? '100%' : undefined,
            borderRadius: s.radius,
            overflow: 'hidden',
            opacity: isDisabled ? 0.45 : 1,
            shadowColor: '#7B3FF2',
            shadowOpacity: isDisabled ? 0 : 0.7,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 10 },
            elevation: isDisabled ? 0 : 14,
          },
          pressed && !isDisabled ? { transform: [{ scale: 0.98 }] } : null,
        ]}
      >
        <LinearGradient
          colors={gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: s.radius }}
        >
          {/* Glossy top sheen — fakes a 3D button highlight */}
          <LinearGradient
            colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '55%',
              borderTopLeftRadius: s.radius,
              borderTopRightRadius: s.radius,
            }}
            pointerEvents="none"
          />
          {renderInner()}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <Pressable
        {...rest}
        disabled={isDisabled}
        style={({ pressed }) => [
          {
            width: fullWidth ? '100%' : undefined,
            borderRadius: s.radius,
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: pressed ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.20)',
            opacity: isDisabled ? 0.45 : 1,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 },
            elevation: 5,
          },
          pressed && !isDisabled ? { transform: [{ scale: 0.985 }] } : null,
        ]}
      >
        <BlurView
          intensity={Platform.OS === 'android' ? 70 : 35}
          tint="dark"
          style={{ borderRadius: s.radius }}
        >
          <View style={{ backgroundColor: 'rgba(36, 28, 64, 0.72)' }}>
            {/* Brand color wash */}
            <LinearGradient
              colors={['rgba(123, 63, 242, 0.22)', 'rgba(0, 209, 255, 0.10)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              pointerEvents="none"
            />
            {/* Top sheen */}
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%' }}
              pointerEvents="none"
            />
            {renderInner()}
          </View>
        </BlurView>
      </Pressable>
    );
  }

  // ghost / danger
  const flatBg =
    variant === 'danger' ? colors.status.error : 'transparent';
  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          width: fullWidth ? '100%' : undefined,
          borderRadius: s.radius,
          backgroundColor: flatBg,
          opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
        },
        pressed && !isDisabled ? { transform: [{ scale: 0.985 }] } : null,
      ]}
    >
      {renderInner()}
    </Pressable>
  );
}
