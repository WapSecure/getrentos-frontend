import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { BedDouble, Bath, Maximize, MapPin, ShieldCheck, Heart } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Price } from './Price';

export interface PropertyCardData {
  id: string;
  title: string;
  location: string;
  price: number;
  period?: 'month' | 'year' | 'night' | null;
  bedrooms?: number;
  bathrooms?: number;
  /** Floor area in m². */
  size?: number;
  image?: string | null;
  verified?: boolean;
  /** Match/quality score 0–100, shown as a ring when present. */
  score?: number | null;
}

export interface PropertyCardProps {
  property: PropertyCardData;
  onPress?: (id: string) => void;
  /** Renders the save heart when provided. */
  onToggleSave?: (id: string) => void;
  saved?: boolean;
  /** `full` = image on top (default). `row` = compact horizontal (saved list, map). */
  layout?: 'full' | 'row';
}

const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

function Spec({ icon, value }: { icon: React.ReactNode; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon}
      <Text
        variant="caption"
        style={{ color: colors.mutedForeground, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  );
}

function Specs({ property }: { property: PropertyCardData }) {
  const { colors } = useTheme();
  const c = colors.mutedForeground;
  const parts: React.ReactNode[] = [];
  if (property.bedrooms != null)
    parts.push(
      <Spec key="b" icon={<BedDouble size={13} color={c} />} value={`${property.bedrooms}`} />
    );
  if (property.bathrooms != null)
    parts.push(
      <Spec key="ba" icon={<Bath size={13} color={c} />} value={`${property.bathrooms}`} />
    );
  if (property.size)
    parts.push(
      <Spec key="s" icon={<Maximize size={13} color={c} />} value={`${property.size} m²`} />
    );
  if (!parts.length) return null;
  return <View style={{ flexDirection: 'row', gap: 14 }}>{parts}</View>;
}

function ScoreRing({ score }: { score: number }) {
  const { colors } = useTheme();
  const tone = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.mutedForeground;
  return (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: tone,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="caption" style={{ color: tone, fontWeight: '800' }}>
        {Math.round(score)}
      </Text>
    </View>
  );
}

function PropertyCardBase({
  property,
  onPress,
  onToggleSave,
  saved = false,
  layout = 'full',
}: PropertyCardProps) {
  const { colors, radius, shadows, spacing } = useTheme();
  const row = layout === 'row';

  const media = (
    <View
      style={{
        width: row ? 116 : '100%',
        height: row ? 116 : 176,
        backgroundColor: colors.secondary,
      }}
    >
      <Image
        source={property.image ? { uri: property.image } : undefined}
        placeholder={{ blurhash: BLURHASH }}
        contentFit="cover"
        transition={200}
        style={StyleSheet.absoluteFill}
      />
      {property.verified ? (
        <View style={[styles.badge, { backgroundColor: 'rgba(9,32,66,0.72)' }]}>
          <ShieldCheck size={12} color="#fff" />
          <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
            Verified
          </Text>
        </View>
      ) : null}
      {onToggleSave ? (
        <Pressable
          onPress={() => onToggleSave(property.id)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save property'}
          style={styles.heart}
        >
          <Heart
            size={16}
            color={saved ? colors.destructive : '#fff'}
            fill={saved ? colors.destructive : 'transparent'}
          />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Pressable
      onPress={onPress ? () => onPress(property.id) : undefined}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          flexDirection: row ? 'row' : 'column',
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          overflow: 'hidden',
          opacity: pressed && onPress ? 0.92 : 1,
        },
        shadows.sm,
      ]}
    >
      {media}
      <View style={{ flex: 1, padding: spacing.md, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Price
              amount={property.price}
              period={property.period ?? undefined}
              variant="subheading"
            />
            <Text variant="bodyStrong" numberOfLines={1}>
              {property.title}
            </Text>
          </View>
          {property.score != null ? <ScoreRing score={property.score} /> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MapPin size={12} color={colors.mutedForeground} />
          <Text variant="caption" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
            {property.location}
          </Text>
        </View>
        <Specs property={property} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9,32,66,0.4)',
  },
});

export const PropertyCard = memo(PropertyCardBase);
