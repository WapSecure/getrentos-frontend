import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme';
import { Text } from './Text';

/** Official GetRentos mark geometry — do not alter. */
const MARK_PATH =
  'M16 44 64 14 112 44 112 70 96 70 96 53 64 33 32 53 32 91 64 110 88 96 88 79 68 79 68 63 104 63 104 105 64 129 16 100Z';

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
      <Path d={MARK_PATH} fill={fill} />
    </Svg>
  );
}
