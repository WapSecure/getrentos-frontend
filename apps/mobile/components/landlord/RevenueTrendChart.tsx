import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from '@sureground/ui-native';
import type { RevenuePoint } from '@/lib/api/landlord';
import { formatNaira } from '@/lib/format';

interface Props {
  points: RevenuePoint[];
}

const PLOT_HEIGHT = 96;

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

      <View style={{ flexDirection: 'row', gap: 2 }}>
        {points.map((p, i) => (
          <View key={`${p.label}-label-${i}`} style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="caption" color="mutedForeground" style={{ fontSize: 12 }}>
              {p.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
