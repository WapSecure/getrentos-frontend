import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface BrandLogoProps {
  /** Height of the mark in px. Default 24. */
  size?: number;
  /** Show the "GetRentos" wordmark next to the mark. Default true. */
  showWordmark?: boolean;
  /** Show the brand tagline under the wordmark. Default false. */
  showTagline?: boolean;
  /**
   * `gradient` (default) = the brand blue gradient mark;
   * `mono` = a single flat colour (follows the theme foreground).
   */
  tone?: 'gradient' | 'mono';
  style?: StyleProp<ViewStyle>;
}

/** The GetRentos logo — official mark + wordmark, theme-aware. */
export function BrandLogo({
  size = 24,
  showWordmark = true,
  showTagline = false,
  tone = 'gradient',
  style,
}: BrandLogoProps) {
  const { colors } = useTheme();
  const wordSize = Math.round(size * 0.74);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: size * 0.34 }, style]}>
      <BrandMark size={size} tone={tone} />
      {showWordmark ? (
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: wordSize, lineHeight: wordSize * 1.05, fontWeight: '800' }}>
            <Text style={{ color: colors.foreground, fontSize: wordSize, fontWeight: '800' }}>
              Get
            </Text>
            <Text style={{ color: colors.primary, fontSize: wordSize, fontWeight: '800' }}>
              Rentos
            </Text>
          </Text>
          {showTagline ? (
            <Text
              style={{
                fontSize: Math.max(8, size * 0.32),
                letterSpacing: 1.6,
                fontWeight: '600',
                color: colors.mutedForeground,
              }}
            >
              HOMES. PEOPLE. OPPORTUNITIES.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Just the mark, no wordmark. */
export function BrandMark({
  size = 24,
  tone = 'gradient',
}: {
  size?: number;
  tone?: 'gradient' | 'mono';
}) {
  const { colors } = useTheme();
  const width = size * (128 / 144);
  const fill = tone === 'mono' ? colors.foreground : 'url(#gr-brand)';

  return (
    <Svg width={width} height={size} viewBox="0 0 128 144">
      {tone === 'gradient' ? (
        <Defs>
          <LinearGradient
            id="gr-brand"
            x1="16"
            y1="14"
            x2="108"
            y2="126"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#35B8FF" />
            <Stop offset="0.55" stopColor="#1478F2" />
            <Stop offset="1" stopColor="#0E5BEF" />
          </LinearGradient>
        </Defs>
      ) : null}
      <Path
        d="M18 122 64 24l46 98"
        fill="none"
        stroke={fill}
        strokeWidth={24}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M64 122V96" fill="none" stroke={fill} strokeWidth={16} strokeLinecap="round" />
    </Svg>
  );
}
