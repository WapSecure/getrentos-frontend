import { memo, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Text, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { isoDay, shiftDay } from '@/lib/hostDates';
import { nightsLabel } from '@/lib/stays';
import { haptics } from '@/lib/haptics';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS_AHEAD = 13;

export interface StayDates {
  checkIn: string;
  checkOut: string;
}

const nightsBetweenDays = (a: string, b: string) =>
  Math.round(
    (new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86_400_000
  );

/** "Sat 20 Dec" for the summary tiles. */
const tileDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

/**
 * Pick a stay: tap the night you arrive, then the morning you leave. Taken
 * nights are struck through and a stay can't run across one; the checkout
 * morning itself may be a taken night (someone else arrives that day).
 */
export function StayDatesSheet(props: {
  open: boolean;
  onClose: () => void;
  value?: StayDates | null;
  onChange: (dates: StayDates | null) => void;
  /** Taken nights, yyyy-MM-dd. */
  unavailable?: readonly string[];
  minNights?: number;
  title?: string;
}) {
  // A fresh picker each time it opens, starting from the current dates.
  return <Picker key={props.open ? 'open' : 'closed'} {...props} />;
}

function Picker({
  open,
  onClose,
  value,
  onChange,
  unavailable,
  minNights = 1,
  title = 'When are you staying?',
}: Parameters<typeof StayDatesSheet>[0]) {
  const { colors, spacing, radius } = useTheme();
  const today = useMemo(() => isoDay(new Date()), []);
  const taken = useMemo(() => new Set(unavailable ?? []), [unavailable]);
  const [start, setStart] = useState<string | null>(value?.checkIn ?? null);
  const [end, setEnd] = useState<string | null>(value?.checkOut ?? null);

  /** The first taken night after check-in: the latest possible checkout. */
  const lastCheckout = useMemo(() => {
    if (!start || end) return null;
    let d = start;
    for (let i = 0; i < 400; i += 1) {
      d = shiftDay(d, 1);
      if (taken.has(d)) return d;
    }
    return null;
  }, [start, end, taken]);

  const pick = (day: string) => {
    void haptics.tap();
    if (!start || end || day <= start) {
      if (taken.has(day)) return;
      setStart(day);
      setEnd(null);
      return;
    }
    if (lastCheckout && day > lastCheckout) {
      if (!taken.has(day)) {
        setStart(day);
        setEnd(null);
      }
      return;
    }
    setEnd(day);
  };

  const months = useMemo(() => {
    const now = new Date();
    return Array.from(
      { length: MONTHS_AHEAD },
      (_, i) => new Date(now.getFullYear(), now.getMonth() + i, 1)
    );
  }, []);

  const nights = start && end ? nightsBetweenDays(start, end) : 0;
  const short = nights > 0 && nights < minNights;

  const tile = (label: string, day: string | null, active: boolean) => (
    <View
      style={{
        flex: 1,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: active ? colors.foreground : colors.border,
        backgroundColor: colors.card,
      }}
    >
      <Text variant="label" color="mutedForeground">
        {label.toUpperCase()}
      </Text>
      <Text variant="bodyStrong" color={day ? 'foreground' : 'mutedForeground'}>
        {day ? tileDate(day) : 'Add date'}
      </Text>
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {tile('Check in', start, !start || !!end)}
        {tile('Check out', end, !!start && !end)}
      </View>
      <Text
        variant="callout"
        color={short ? 'destructive' : 'mutedForeground'}
        accessibilityLiveRegion="polite"
      >
        {nights
          ? short
            ? `This stay needs at least ${nightsLabel(minNights)}.`
            : `${nightsLabel(nights)} selected`
          : start
            ? 'Now pick the morning you leave.'
            : minNights > 1
              ? `Pick the night you arrive · minimum ${nightsLabel(minNights)}`
              : 'Pick the night you arrive.'}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button
          label="Clear"
          variant="ghost"
          fullWidth={false}
          disabled={!start}
          onPress={() => {
            setStart(null);
            setEnd(null);
          }}
        />
        <Button
          label="Save dates"
          style={{ flex: 1 }}
          disabled={(!!start && !end) || short}
          onPress={() => {
            onChange(start && end ? { checkIn: start, checkOut: end } : null);
            onClose();
          }}
        />
      </View>
    </View>
  );

  return (
    <Sheet open={open} onClose={onClose} title={title} snapPoints={['90%']} footer={footer}>
      <View style={{ gap: spacing['2xl'], paddingBottom: spacing.md }}>
        {months.map((m) => (
          <Month
            key={m.toISOString()}
            month={m}
            today={today}
            taken={taken}
            start={start}
            end={end}
            lastCheckout={lastCheckout}
            onPick={pick}
          />
        ))}
      </View>
    </Sheet>
  );
}

const Month = memo(function Month({
  month,
  today,
  taken,
  start,
  end,
  lastCheckout,
  onPick,
}: {
  month: Date;
  today: string;
  taken: Set<string>;
  start: string | null;
  end: string | null;
  lastCheckout: string | null;
  onPick: (day: string) => void;
}) {
  const { colors, spacing } = useTheme();
  const cells = useMemo(() => {
    const lead = (month.getDay() + 6) % 7; // Monday first
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= days; d += 1)
      out.push(isoDay(new Date(month.getFullYear(), month.getMonth(), d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [month]);

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="subheading" accessibilityRole="header">
        {month.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
      </Text>
      <View style={{ flexDirection: 'row' }} importantForAccessibility="no-hide-descendants">
        {WEEKDAYS.map((w, i) => (
          <Text
            key={`${w}${i}`}
            variant="caption"
            color="mutedForeground"
            style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}
          >
            {w}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: 44 }} />;
          const past = day < today;
          const isTaken = taken.has(day);
          const isStart = day === start;
          const isEnd = day === end;
          const inside = !!start && !!end && day > start && day < end;
          // Choosing checkout: past the next taken night is out of reach.
          const beyond = !!start && !end && !!lastCheckout && day > lastCheckout;
          const pickingEnd = !!start && !end && day > start;
          const disabled = past || beyond || (isTaken && !(pickingEnd && day === lastCheckout));
          const band = inside || (isStart && !!end) || (isEnd && !!start);
          const dot = isStart || isEnd;
          const label = new Date(`${day}T12:00:00`).toLocaleDateString('en-NG', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          });
          return (
            <Pressable
              key={day}
              onPress={() => onPick(day)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`${label}${isTaken ? ', unavailable' : ''}${isStart ? ', check in' : ''}${isEnd ? ', check out' : ''}`}
              accessibilityState={{ disabled, selected: dot || inside }}
              style={{ width: `${100 / 7}%`, height: 44, justifyContent: 'center' }}
            >
              {band ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 4,
                    bottom: 4,
                    left: isStart ? '50%' : 0,
                    right: isEnd ? '50%' : 0,
                    backgroundColor: colors.secondary,
                  }}
                />
              ) : null}
              <View
                style={{
                  alignSelf: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: dot ? colors.foreground : 'transparent',
                  borderWidth: day === today && !dot ? 1 : 0,
                  borderColor: colors.border,
                }}
              >
                <Text
                  variant="callout"
                  style={{
                    fontWeight: dot ? '700' : '500',
                    color: dot
                      ? colors.background
                      : disabled
                        ? colors.mutedForeground
                        : colors.foreground,
                    opacity: disabled && !dot ? 0.4 : 1,
                    textDecorationLine: isTaken && !past ? 'line-through' : 'none',
                  }}
                >
                  {Number(day.slice(8))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
