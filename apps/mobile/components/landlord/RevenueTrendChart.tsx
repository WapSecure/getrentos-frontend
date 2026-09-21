import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from '@getrentos/ui-native';
import type { RevenuePoint } from '@/lib/api/landlord';
import { formatNaira } from '@/lib/format';

interface Props {
  points: RevenuePoint[];
}

const PLOT_HEIGHT = 96;

/**
 * Monthly rent collected — magnitude per discrete period, so bars rather than a
 * line. One series, so no legend: the section heading names it.
 *
 * Only the peak is labelled by default; tapping a bar reveals that month's
 * figure, which is the touch equivalent of a hover tooltip.
 */
export function RevenueTrendChart({ points }: Props) {
  const { colors, spacing, radius } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);

  const max = Math.max(...points.map((p) => p.value), 0);
  const peakIndex = max > 0 ? points.findIndex((p) => p.value === max) : -1;
  const active = selected ?? peakIndex;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ height: 18, justifyContent: 'center' }}>
        {active >= 0 && points[active] ? (
          <Text variant="callout" style={{ fontWeight: '700' }}>
            {formatNaira(points[active].value)}
            <Text variant="caption" color="mutedForeground">
              {'  '}
              {points[active].label}
            </Text>
          </Text>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height: PLOT_HEIGHT,
          gap: 2,
        }}
      >
        {points.map((p, i) => {
          // A zero month still gets a hairline so the period reads as present.
          const h = max > 0 ? Math.max((p.value / max) * PLOT_HEIGHT, 2) : 2;
          const isActive = i === active;
          return (
            <Pressable
              key={`${p.label}-${i}`}
              onPress={() => setSelected(i === selected ? null : i)}
              accessibilityRole="button"
              accessibilityLabel={`${p.label}: ${formatNaira(p.value)}`}
              accessibilityState={{ selected: isActive }}
              style={{ flex: 1, justifyContent: 'flex-end', height: PLOT_HEIGHT }}
            >
              <View
                style={{
                  height: h,
                  borderTopLeftRadius: radius.sm / 2,
                  borderTopRightRadius: radius.sm / 2,
                  backgroundColor: isActive ? colors.primary : colors.primary + '59',
                }}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Recessive axis: month labels only, no gridlines behind six bars. */}
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {points.map((p, i) => (
          <View key={`${p.label}-label-${i}`} style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="caption" color="mutedForeground" style={{ fontSize: 10 }}>
              {p.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
