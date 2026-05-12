import React from 'react';
import { type ViewProps, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { GlassSurface } from './GlassSurface';

interface Props extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
  onPress?: PressableProps['onPress'];
  glow?: boolean;
  /**
   * - default: balanced glass with a subtle brand wash
   * - subtle:  lighter glass for nested content
   * - strong:  more opaque + bright purple border (selected state)
   * - tinted:  brand-tinted glass (purple cast) for hero/profile cards
   */
  variant?: 'default' | 'subtle' | 'strong' | 'tinted' | 'dark';
  padding?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Modern translucent card. Wraps GlassSurface with sensible defaults for
 * content surfaces across the app.
 */
export function Card({
  children,
  onPress,
  glow,
  variant = 'default',
  padding = 18,
  radius = 20,
  style,
}: Props) {
  if (onPress) {
    return (
      <GlassSurface
        onPress={onPress}
        glow={glow}
        variant={variant}
        padding={padding}
        radius={radius}
        style={style}
      >
        {children}
      </GlassSurface>
    );
  }
  return (
    <GlassSurface
      glow={glow}
      variant={variant}
      padding={padding}
      radius={radius}
      style={style}
    >
      {children}
    </GlassSurface>
  );
}
