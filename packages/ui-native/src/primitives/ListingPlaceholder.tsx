import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';
import { House } from '@sureground/icons/native';
import { useTheme } from '../theme';
import { Text } from './Text';

export type ListingPlaceholderSize = 'thumb' | 'card' | 'hero';

export interface ListingPlaceholderProps {
  size?: ListingPlaceholderSize;
  /** Area to name under the mark, e.g. "Ikoyi". Shown on card and hero sizes only; on cards it replaces the caption. */
  area?: string | null;
  /** Line under the mark. Defaults to "Photos coming soon". */
  caption?: string;
  /**
   * "onDark" draws a fixed deep slate in both themes, for cards that lay white text
   * over the image area. Captions are left out; the card supplies its own text.
   */
  tone?: 'theme' | 'onDark';
  /** Leaves room at the top for badges that sit over the image area. */
  topInset?: number;
  style?: StyleProp<ViewStyle>;
}

const ON_DARK_SURFACE = '#1b2433';

const TILE = { thumb: 30, card: 32, hero: 64 } as const;
const ICON = { thumb: 15, card: 16, hero: 28 } as const;

/**
 * Stands in for a listing photo. A tinted dot grid with the house mark in the icon
 * set's cut-corner tile, so a listing without photos still looks deliberate.
 */
export function ListingPlaceholder({
  size = 'card',
  area,
  caption = 'Photos coming soon',
  topInset = 0,
  tone = 'theme',
  style,
}: ListingPlaceholderProps) {
  const { colors } = useTheme();
  const dark = tone === 'onDark';
  const ink = dark ? '#ffffff' : colors.primary;
  const tile = TILE[size];
  const cut = Math.round(tile * 0.28);
  const id = `sg-dots-${size}-${tone}`;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: dark ? ON_DARK_SURFACE : colors.secondary },
        style,
      ]}
      accessible={false}
      pointerEvents="none"
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={14} height={14} patternUnits="userSpaceOnUse">
            <Circle cx={2} cy={2} r={1} fill={ink} fillOpacity={dark ? 0.12 : 0.22} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      <View style={[styles.center, { paddingTop: topInset, gap: size === 'hero' ? 10 : 6 }]}>
        <View style={{ width: tile, height: tile, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={tile} height={tile} style={StyleSheet.absoluteFill}>
            <Path
              d={`M0 0 H${tile - cut} L${tile} ${cut} V${tile} H0 Z`}
              fill={ink}
              fillOpacity={dark ? 0.08 : 0.14}
              stroke={ink}
              strokeOpacity={dark ? 0.22 : 0.35}
              strokeWidth={1}
            />
          </Svg>
          <House size={ICON[size]} color={dark ? 'rgba(255,255,255,0.72)' : colors.primary} />
        </View>
        {size !== 'thumb' && !dark ? (
          <View style={{ alignItems: 'center', gap: 1 }}>
            {area ? (
              <Text variant={size === 'hero' ? 'bodyStrong' : 'label'} numberOfLines={1}>
                {area}
              </Text>
            ) : null}
            {/* Card images are short; the area alone fits, the caption is for the hero. */}
            {size === 'hero' || !area ? (
              <Text variant="caption" color="mutedForeground">
                {caption}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
});
