import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface BrandLogoProps {
  /** Height of the mark in px. Default 24. */
  size?: number;
  /** Show the "Sureground" wordmark next to the mark. Default true. */
  showWordmark?: boolean;
  /** Show the brand tagline under the wordmark. Default false. */
  showTagline?: boolean;
  tone?: 'brand' | 'mono';
  style?: StyleProp<ViewStyle>;
}

/** The Sureground logo — official mark + wordmark, theme-aware. */
export function BrandLogo({
  size = 24,
  showWordmark = true,
  showTagline = false,
  tone = 'brand',
  style,
}: BrandLogoProps) {
  const { colors } = useTheme();
  const wordSize = Math.round(size * 0.74);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: size * 0.34 }, style]}>
      <BrandMark size={size} tone={tone} />
      {showWordmark ? (
        <View style={{ gap: 2 }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: wordSize,
              lineHeight: wordSize * 1.05,
              fontWeight: '800',
              letterSpacing: -0.025 * wordSize,
            }}
          >
            Sureground
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
  tone = 'brand',
}: {
  size?: number;
  tone?: 'brand' | 'mono';
}) {
  const { colors } = useTheme();
  const stroke = tone === 'mono' ? colors.foreground : colors.primary;

  // Home on firm ground: an open roof over a solid ground line.
  return (
    <Svg width={size} height={size} viewBox="0 0 128 128">
      <Path
        d="M28 82 64 22l36 60"
        fill="none"
        stroke={stroke}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 108h104" fill="none" stroke={stroke} strokeWidth={16} strokeLinecap="round" />
    </Svg>
  );
}
