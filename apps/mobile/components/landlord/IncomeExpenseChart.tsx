import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from '@getrentos/ui-native';
import type { FinancialsPoint } from '@/lib/api/landlord';
import { formatNaira } from '@/lib/format';
import { seriesColor } from './chartPalette';

interface Props {
  points: FinancialsPoint[];
}

const PLOT_HEIGHT = 110;

/**
 * Income against expenses per month. Both series are Naira, so they share one
 * axis — never a second scale. Two series means a legend is always present;
 * tapping a period reveals both its figures, the touch equivalent of a hover
 * tooltip.
 */
export function IncomeExpenseChart({ points }: Props) {
  const { colors, spacing, radius, scheme } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);

  const income = seriesColor('income', scheme === 'dark' ? 'dark' : 'light');
  const expenses = seriesColor('expenses', scheme === 'dark' ? 'dark' : 'light');

  const max = Math.max(...points.flatMap((p) => [p.income, p.expenses]), 0);
  const active = selected ?? points.length - 1;
  const shown = points[active];

  const barHeight = (v: number) => (max > 0 ? Math.max((v / max) * PLOT_HEIGHT, 2) : 2);

  return (
    <View style={{ gap: spacing.sm }}>
      {/* Readout for the selected period — values wear text tokens, not series colour. */}
      <View style={{ height: 34, justifyContent: 'center' }}>
        {shown ? (
          <View style={{ gap: 2 }}>
            <Text variant="caption" color="mutedForeground">
              {shown.period}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Text variant="callout" style={{ fontWeight: '700' }}>
                {formatNaira(shown.income)}
              </Text>
              <Text variant="callout" color="mutedForeground">
                −{formatNaira(shown.expenses)}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: PLOT_HEIGHT, gap: 6 }}>
        {points.map((p, i) => {
          const isActive = i === active;
          return (
            <Pressable
              key={`${p.period}-${i}`}
              onPress={() => setSelected(i === selected ? null : i)}
              accessibilityRole="button"
              accessibilityLabel={`${p.period}: income ${formatNaira(p.income)}, expenses ${formatNaira(p.expenses)}`}
              accessibilityState={{ selected: isActive }}
              style={{
                flex: 1,
                height: PLOT_HEIGHT,
                justifyContent: 'flex-end',
                flexDirection: 'row',
                alignItems: 'flex-end',
                // 2px surface gap between the paired bars.
                gap: 2,
                opacity: isActive ? 1 : 0.55,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: barHeight(p.income),
                  borderTopLeftRadius: radius.sm / 2,
                  borderTopRightRadius: radius.sm / 2,
                  backgroundColor: income,
                }}
              />
              <View
                style={{
                  flex: 1,
                  height: barHeight(p.expenses),
                  borderTopLeftRadius: radius.sm / 2,
                  borderTopRightRadius: radius.sm / 2,
                  backgroundColor: expenses,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {points.map((p, i) => (
          <View key={`${p.period}-l-${i}`} style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="caption" color="mutedForeground" style={{ fontSize: 10 }}>
              {p.period}
            </Text>
          </View>
        ))}
      </View>

      {/* Two series, so a legend is always present — identity is never colour alone. */}
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.lg,
          paddingTop: spacing.xs,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <LegendItem color={income} label="Income" />
        <LegendItem color={expenses} label="Expenses" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: color }} />
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
    </View>
  );
}
