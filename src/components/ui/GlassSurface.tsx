import React from 'react';
import {
  View,
  Pressable,
  type ViewProps,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { radii } from '../../theme/tokens';

type Variant = 'default' | 'subtle' | 'strong' | 'tinted' | 'dark';

interface BaseProps {
  children: React.ReactNode;
  variant?: Variant;
  radius?: number;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
}

interface StaticProps extends BaseProps, Omit<ViewProps, 'children' | 'style'> {
  onPress?: undefined;
}

interface PressableSurfaceProps extends BaseProps {
  onPress: PressableProps['onPress'];
  onLongPress?: PressableProps['onLongPress'];
  disabled?: boolean;
}

type Props = StaticProps | PressableSurfaceProps;

interface VariantSpec {
  intensity: number;
  bg: string;
  border: string;
  sheen: readonly [string, string];
  tint: readonly [string, string] | null;
  /** Top edge "neon piping" — a 1.5px gradient bar across the top inside the card. */
  showTopAccent: boolean;
}

const VARIANTS: Record<Variant, VariantSpec> = {
  default: {
    intensity: Platform.OS === 'android' ? 40 : 18,
    bg: 'rgba(10, 10, 18, 0.92)',
    border: 'rgba(255, 255, 255, 0.12)',
    sheen: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0)'],
    tint: null,
    showTopAccent: true,
  },
  subtle: {
    intensity: Platform.OS === 'android' ? 40 : 18,
    bg: 'rgba(10, 10, 18, 0.80)',
    border: 'rgba(255, 255, 255, 0.10)',
    sheen: ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0)'],
    tint: null,
    showTopAccent: false,
  },
  strong: {
    intensity: Platform.OS === 'android' ? 95 : 55,
    bg: 'rgba(48, 32, 84, 0.85)',
    border: 'rgba(123, 63, 242, 0.65)',
    sheen: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)'],
    tint: ['rgba(123, 63, 242, 0.22)', 'rgba(0, 209, 255, 0.12)'],
    showTopAccent: true,
  },
  tinted: {
    intensity: Platform.OS === 'android' ? 80 : 40,
    bg: 'rgba(52, 32, 92, 0.78)',
    border: 'rgba(255, 255, 255, 0.26)',
    sheen: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)'],
    tint: ['rgba(255, 77, 166, 0.18)', 'rgba(0, 209, 255, 0.12)'],
    showTopAccent: true,
  },
  dark: {
    intensity: Platform.OS === 'android' ? 40 : 18,
    bg: 'rgba(10, 10, 18, 0.92)',
    border: 'rgba(255, 255, 255, 0.12)',
    sheen: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0)'],
    tint: null,
    showTopAccent: true,
  },
};

/**
 * Modern translucent surface with: backdrop blur, brand-tinted background,
 * stronger hairline border, top sheen highlight, optional brand wash, optional
 * neon top-edge accent piping, and a layered shadow for real depth.
 */
export function GlassSurface(props: Props): React.ReactElement {
  const {
    children,
    variant = 'default',
    radius = radii.lg,
    padding = 16,
    style,
    glow,
  } = props;

  const v = VARIANTS[variant];

  const containerStyle: StyleProp<ViewStyle> = [
    {
      borderRadius: radius,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: v.border,
    },
    glow
      ? {
          shadowColor: '#7B3FF2',
          shadowOpacity: 0.55,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 14,
        }
      : {
          // Stronger ambient — gives every card real "lift" off the background.
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        },
    style,
  ];

  const inner = (
    <BlurView
      intensity={v.intensity}
      tint="dark"
      style={{ borderRadius: radius, overflow: 'hidden' }}
    >
      <View
        style={{
          backgroundColor: v.bg,
          borderRadius: radius,
          overflow: 'hidden',
        }}
      >
        {/* Brand-color diagonal wash */}
        {v.tint ? (
          <LinearGradient
            colors={v.tint}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            pointerEvents="none"
          />
        ) : null}

        {/* Top sheen */}
        <LinearGradient
          colors={v.sheen}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
          }}
          pointerEvents="none"
        />

        {/* Top edge neon piping — 1.5px bright gradient bar */}
        {v.showTopAccent ? (
          <LinearGradient
            colors={['rgba(255, 77, 166, 0.85)', 'rgba(123, 63, 242, 0.85)', 'rgba(0, 209, 255, 0.85)']}
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
        ) : null}

        <View style={{ padding }}>{children}</View>
      </View>
    </BlurView>
  );

  if ('onPress' in props && props.onPress) {
    return (
      <Pressable
        onPress={props.onPress}
        onLongPress={props.onLongPress}
        disabled={props.disabled}
        style={({ pressed }) => [
          ...(Array.isArray(containerStyle) ? containerStyle : [containerStyle]),
          pressed ? { transform: [{ scale: 0.985 }], opacity: 0.95 } : null,
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{inner}</View>;
}
