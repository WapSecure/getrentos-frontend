import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Divider, Text, useTheme } from '@sureground/ui-native';
import type { FinancialsPoint } from '@/lib/api/landlord';
import { formatNaira } from '@/lib/format';
import { seriesColor } from './chartPalette';

interface Props {
  points: FinancialsPoint[];
}

const PLOT_HEIGHT = 110;

// Both series are Naira, so they share one axis: never a second scale.
export function IncomeExpenseChart({ points }: Props) {
  const { spacing, radius, scheme } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);

  const income = seriesColor('income', scheme === 'dark' ? 'dark' : 'light');
  const expenses = seriesColor('expenses', scheme === 'dark' ? 'dark' : 'light');

  const max = Math.max(...points.flatMap((p) => [p.income, p.expenses]), 0);
  const active = selected ?? points.length - 1;
  const shown = points[active];

  const barHeight = (v: number) => (max > 0 ? Math.max((v / max) * PLOT_HEIGHT, 2) : 2);

  return (
    <View style={{ gap: spacing.sm }}>
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
            <Text variant="caption" color="mutedForeground" style={{ fontSize: 12 }}>
              {p.period}
            </Text>
          </View>
        ))}
      </View>

      {/* A legend always: identity is never colour alone. */}
      <View style={{ gap: spacing.xs }}>
        <Divider />
        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          <LegendItem color={income} label="Income" />
          <LegendItem color={expenses} label="Expenses" />
        </View>
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
