import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

interface Props {
  /** Pixel font size for the wordmark. Default 32. */
  size?: number;
  /** Letter spacing in pixels. Default 1.2. */
  letterSpacing?: number;
  /** Forward slant in degrees (negative leans right). Default -12. */
  slant?: number;
}

const TEXT = 'PARTYBOND';
const GRADIENT_ID_BASE = 'partybondGrad';

let gradientCounter = 0;

/**
 * Stylised "PARTYBOND" wordmark — bold letters with a forward diagonal slant
 * and a continuous pink → purple → blue horizontal gradient. Implemented with
 * `react-native-svg` so the gradient + slant render identically across
 * iOS / Android / Web (independent of the system italic font).
 */
export function WordmarkPartybond({ size = 32, letterSpacing = 1.2, slant = -12 }: Props) {
  // Stable but unique gradient id per instance so multiple wordmarks can coexist
  // on the same screen without their <defs> colliding.
  const gradientId = React.useMemo(() => `${GRADIENT_ID_BASE}_${++gradientCounter}`, []);

  // Heavy, bold letters take roughly 0.62 * fontSize per glyph; account for
  // letter-spacing and a small margin for the slant overhang on both sides.
  const charAdvance = size * 0.62 + letterSpacing;
  const slantOverhang = Math.ceil(size * Math.tan(Math.abs(slant) * (Math.PI / 180)));
  const width = Math.ceil(charAdvance * TEXT.length + size * 0.4 + slantOverhang * 2);
  const height = Math.ceil(size * 1.3);
  const baselineY = Math.round(size * 1.0);

  // Translate to undo the horizontal shift caused by skewing about the origin
  // so the slanted text remains visually centred in the SVG box.
  const skewShift = (height - baselineY) * Math.tan((slant * Math.PI) / 180);
  const cx = width / 2 - skewShift;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor="#FF4DA6" />
            <Stop offset="50%" stopColor="#A75BF0" />
            <Stop offset="100%" stopColor="#00D1FF" />
          </LinearGradient>
        </Defs>
        {/* Soft glow underlay — slightly larger fill, low opacity. */}
        <SvgText
          x={cx}
          y={baselineY}
          fill={`url(#${gradientId})`}
          fillOpacity={0.35}
          textAnchor="middle"
          fontSize={size + 2}
          fontWeight="900"
          letterSpacing={letterSpacing}
          transform={`skewX(${slant})`}
        >
          {TEXT}
        </SvgText>
        {/* Crisp foreground letters. */}
        <SvgText
          x={cx}
          y={baselineY}
          fill={`url(#${gradientId})`}
          textAnchor="middle"
          fontSize={size}
          fontWeight="900"
          letterSpacing={letterSpacing}
          transform={`skewX(${slant})`}
        >
          {TEXT}
        </SvgText>
      </Svg>
    </View>
  );
}
