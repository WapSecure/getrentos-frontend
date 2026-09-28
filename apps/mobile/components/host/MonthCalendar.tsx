import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from '@getrentos/ui-native';
import { isoDay } from '@/lib/hostDates';

export { isoDay, nightsBetween, occupied, shiftDay } from '@/lib/hostDates';

export type DayState = 'booked' | 'request' | 'blocked' | 'imported' | 'free';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * One month of nights. Booked, requested and blocked nights are coloured; a
 * selected range (for blocking) is drawn solid. Past nights are dimmed and
 * can't be picked.
 */
export const MonthCalendar = memo(function MonthCalendar({
  month,
  states,
  selStart,
  selEnd,
  today,
  onPress,
}: {
  /** Any date in the month to draw. */
  month: Date;
  states: Map<string, DayState>;
  selStart?: string | null;
  selEnd?: string | null;
  today: string;
  onPress: (day: string) => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // Monday first
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= days; d += 1)
      out.push(isoDay(new Date(month.getFullYear(), month.getMonth(), d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [month]);

  const fill: Record<Exclude<DayState, 'free'>, { bg: string; fg: string }> = {
    booked: { bg: colors.primary, fg: colors.primaryForeground },
    request: { bg: colors.warningSubtle, fg: colors.warning },
    blocked: { bg: colors.secondary, fg: colors.mutedForeground },
    imported: { bg: colors.purpleSubtle, fg: colors.purple },
  };

  const inSel = (d: string) => !!selStart && d >= selStart && d <= (selEnd ?? selStart);

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="subheading" accessibilityRole="header">
        {month.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
      </Text>
      <View style={{ flexDirection: 'row' }} importantForAccessibility="no-hide-descendants">
        {WEEKDAYS.map((w, i) => (
          <Text key={i} variant="caption" color="mutedForeground" center style={{ flex: 1 }}>
            {w}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const state = states.get(d) ?? 'free';
          const past = d < today;
          const sel = inSel(d);
          const style = state !== 'free' ? fill[state] : null;
          const label = `${new Date(`${d}T12:00:00`).toLocaleDateString('en-NG', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}, ${state === 'free' ? 'open' : state}${sel ? ', selected' : ''}`;
          return (
            <Pressable
              key={d}
              onPress={() => onPress(d)}
              disabled={past}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ disabled: past, selected: sel }}
              style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sel ? colors.foreground : (style?.bg ?? 'transparent'),
                  borderWidth: d === today ? 1.5 : 0,
                  borderColor: colors.primary,
                  opacity: past ? 0.35 : 1,
                }}
              >
                <Text
                  variant="callout"
                  style={{
                    fontWeight: state === 'free' && !sel ? '500' : '700',
                    color: sel ? colors.background : (style?.fg ?? colors.foreground),
                  }}
                >
                  {Number(d.slice(8))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

export function CalendarLegend() {
  const { colors, spacing } = useTheme();
  const items: [string, string][] = [
    ['Booked', colors.primary],
    ['Request', colors.warning],
    ['Blocked', colors.mutedForeground],
    ['Other site', colors.purple],
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {items.map(([label, c]) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} />
          <Text variant="caption" color="mutedForeground">
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
