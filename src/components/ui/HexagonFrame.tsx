import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  ClipPath,
  Polygon,
  LinearGradient as SvgGradient,
  Stop,
  Image as SvgImage,
} from 'react-native-svg';
import { gradient } from '../../theme/tokens';
import { resolvePhotoUri } from './Avatar';

const HEX_POINTS = '50,2 97,29.5 97,85.5 50,113 3,85.5 3,29.5';

interface Props {
  size?: number;
  uri?: string | null;
  initials?: string;
  /** Accent for the hex border glow */
  accent?: 'purple' | 'blue' | 'pink';
  children?: React.ReactNode;
}

const ACCENT_STOPS: Record<NonNullable<Props['accent']>, [string, string]> = {
  purple: ['#FF4DA6', '#7B3FF2'],
  blue: ['#7B3FF2', '#00D1FF'],
  pink: ['#FF4DA6', '#FF7DBF'],
};

export function HexagonFrame({
  size = 88,
  uri,
  initials,
  accent = 'purple',
  children,
}: Props) {
  const height = size * 1.15;
  const resolved = uri ? resolvePhotoUri(uri) : null;
  const [c0, c1] = ACCENT_STOPS[accent];
  const gradId = `hexBorder-${accent}`;

  return (
    <View style={{ width: size, height, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={height} viewBox="0 0 100 115">
        <Defs>
          <ClipPath id="hexClip">
            <Polygon points={HEX_POINTS} />
          </ClipPath>
          <SvgGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={c0} />
            <Stop offset="100%" stopColor={c1} />
          </SvgGradient>
        </Defs>
        {resolved ? (
          <SvgImage
            href={resolved}
            width={100}
            height={115}
            clipPath="url(#hexClip)"
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <Polygon points={HEX_POINTS} fill="#12121A" />
        )}
        <Polygon
          points={HEX_POINTS}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={3}
        />
      </Svg>
      {!resolved && initials ? (
        <View style={[StyleSheet.absoluteFill, styles.initialsWrap]}>
          <Text style={[styles.initials, { fontSize: size * 0.28 }]}>{initials}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Large success hexagon with checkmark (post-create hero). */
export function HexagonSuccessBadge({ size = 72 }: { size?: number }) {
  const height = size * 1.15;
  const [pink, mid, blue] = gradient.primary;

  return (
    <View style={{ width: size, height, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={height} viewBox="0 0 100 115">
        <Defs>
          <SvgGradient id="successHex" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={pink} />
            <Stop offset="50%" stopColor={mid} />
            <Stop offset="100%" stopColor={blue} />
          </SvgGradient>
        </Defs>
        <Polygon points={HEX_POINTS} fill="rgba(123,63,242,0.28)" stroke="url(#successHex)" strokeWidth={3.5} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.initialsWrap]}>
        <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '800' }}>✓</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  initialsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '800',
  },
});
