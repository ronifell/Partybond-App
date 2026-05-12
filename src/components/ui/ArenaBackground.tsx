import React, { useMemo } from 'react';
import { View, Dimensions, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Code-generated background for a premium gaming app — no image required.
 *
 * Composition (back → front):
 *   1. Deep navy base (#0A0A12)
 *   2. Vignette wash (slightly lighter mid, darker edges)
 *   3. Four large radial-style color glows pinned to corners
 *      (pink top-left, purple top-right, cyan bottom-left, magenta bottom-right)
 *   4. Two diagonal "neon streak" accent lines
 *   5. Subtle dot grid overlay (gives a high-tech / esports feel)
 *
 * Sized to the full physical screen so it sits behind the status bar and
 * navigation bar (in conjunction with edge-to-edge config in App.tsx).
 */

interface GlowSpec {
  color: string;
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  opacity?: number;
}

function RadialGlow({
  color,
  size,
  top,
  left,
  right,
  bottom,
  opacity = 1,
}: GlowSpec): React.ReactElement {
  // Fake a radial gradient using a circular masked LinearGradient.
  // Center of the "ellipse" is implicit via size + position offsets.
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        opacity,
      }}
    >
      <LinearGradient
        colors={[color, 'transparent']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, transform: [{ scale: 1.2 }] }}
      />
    </View>
  );
}

function DotGrid({ width, height }: { width: number; height: number }): React.ReactElement {
  const SPACING = 28;
  const DOT_SIZE = 1.5;
  const COLOR = 'rgba(255,255,255,0.06)';

  const dots = useMemo(() => {
    const cols = Math.ceil(width / SPACING) + 1;
    const rows = Math.ceil(height / SPACING) + 1;
    const arr: Array<{ key: string; left: number; top: number }> = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        arr.push({ key: `${r}-${c}`, left: c * SPACING, top: r * SPACING });
      }
    }
    return arr;
  }, [width, height]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width, height }}>
      {dots.map((d) => (
        <View
          key={d.key}
          style={{
            position: 'absolute',
            left: d.left,
            top: d.top,
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: COLOR,
          }}
        />
      ))}
    </View>
  );
}

export function ArenaBackground(): React.ReactElement {
  const { width } = useWindowDimensions();
  const screenHeight = Dimensions.get('screen').height;

  // Glow halos sized relative to the screen so they look right on any device.
  const big = Math.max(width * 1.1, 420);
  const medium = Math.max(width * 0.85, 320);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height: screenHeight,
        backgroundColor: '#070710',
        overflow: 'hidden',
      }}
    >
      {/* Subtle diagonal mesh wash (top-left → bottom-right) */}
      <LinearGradient
        colors={['rgba(123, 63, 242, 0.18)', 'rgba(10, 10, 18, 0)', 'rgba(0, 209, 255, 0.10)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Radial color glows */}
      <RadialGlow
        color="rgba(255, 77, 166, 0.55)"
        size={big}
        top={-big * 0.35}
        left={-big * 0.25}
        opacity={0.9}
      />
      <RadialGlow
        color="rgba(123, 63, 242, 0.65)"
        size={medium}
        top={-medium * 0.2}
        right={-medium * 0.3}
        opacity={0.85}
      />
      <RadialGlow
        color="rgba(0, 209, 255, 0.45)"
        size={big}
        bottom={-big * 0.45}
        left={-big * 0.3}
        opacity={0.8}
      />
      <RadialGlow
        color="rgba(255, 77, 166, 0.30)"
        size={medium}
        bottom={-medium * 0.35}
        right={-medium * 0.25}
        opacity={0.7}
      />

      {/* Diagonal neon streak — adds dynamic "speed" energy */}
      <View
        style={{
          position: 'absolute',
          top: screenHeight * 0.25,
          left: -width * 0.2,
          width: width * 1.5,
          height: 1.5,
          backgroundColor: 'rgba(255, 77, 166, 0.18)',
          transform: [{ rotate: '-8deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: screenHeight * 0.6,
          left: -width * 0.2,
          width: width * 1.5,
          height: 1,
          backgroundColor: 'rgba(0, 209, 255, 0.14)',
          transform: [{ rotate: '6deg' }],
        }}
      />

      {/* Dot grid for tech/esports texture */}
      <DotGrid width={width} height={screenHeight} />

      {/* Soft center vignette to keep UI focal area readable */}
      <LinearGradient
        colors={['rgba(7, 7, 16, 0)', 'rgba(7, 7, 16, 0.45)']}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </View>
  );
}
