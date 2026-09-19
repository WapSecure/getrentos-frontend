import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));

export interface DateFieldProps {
  /** ISO calendar date, `yyyy-MM-dd`. */
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  /** Earliest selectable date, `yyyy-MM-dd`. */
  min?: string;
  /** Latest selectable date, `yyyy-MM-dd`. */
  max?: string;
  error?: string | null;
  hint?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/* ------------------------------ date helpers ----------------------------- */

/** Parses `yyyy-MM-dd` as a *local* date, so a day never shifts across timezones. */
function parseISODate(value?: string): Date | undefined {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Formats a `Date` as a local `yyyy-MM-dd` string. */
export function toISODate(d: Date): string {
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDisplay(d: Date): string {
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Date input with a calendar popover, matching the web `DatePicker`:
 * same `yyyy-MM-dd` value contract, month grid, min/max limits and Today shortcut.
 */
export function DateField({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  min,
  max,
  error,
  hint,
  disabled,
  containerStyle,
}: DateFieldProps) {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = parseISODate(value);
  const minDate = parseISODate(min);
  const maxDate = parseISODate(max);

  const [viewMonth, setViewMonth] = useState<Date>(() => selected ?? new Date());

  const { days, leadingBlanks } = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    return {
      leadingBlanks: first.getDay(),
      days: Array.from(
        { length: daysInMonth },
        (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)
      ),
    };
  }, [viewMonth]);

  const isDisabledDay = (day: Date) =>
    (!!minDate && day < startOfDay(minDate)) || (!!maxDate && day > startOfDay(maxDate));

  const openPicker = () => {
    if (disabled) return;
    setViewMonth(selected ?? new Date());
    setOpen(true);
  };

  const select = (day: Date) => {
    if (isDisabledDay(day)) return;
    onChange(toISODate(day));
    setOpen(false);
  };

  const today = startOfDay(new Date());
  const borderColor = error ? colors.destructive : 'transparent';

  return (
    <View style={[{ gap: 7 }, containerStyle]}>
      {label ? (
        <Text
          variant="callout"
          color="mutedForeground"
          style={{ marginLeft: 4, fontWeight: '600' }}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          minHeight: 54,
          borderRadius: radius.md,
          backgroundColor: colors.secondary,
          borderWidth: 1.5,
          borderColor,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text
          variant="body"
          color={selected ? 'foreground' : 'mutedForeground'}
          style={{ flex: 1 }}
        >
          {selected ? formatDisplay(selected) : placeholder}
        </Text>
        <Calendar size={18} color={colors.mutedForeground} />
      </Pressable>

      {error ? (
        <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)}>
          <Text variant="caption" color="destructive" style={{ marginLeft: 4 }}>
            {error}
          </Text>
        </Animated.View>
      ) : hint ? (
        <Text variant="caption" color="mutedForeground" style={{ marginLeft: 4 }}>
          {hint}
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close calendar"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          {/* Swallow presses inside the card so tapping the calendar doesn't dismiss it. */}
          <Pressable
            onPress={() => {}}
            style={{
              width: 320,
              maxWidth: '90%',
              borderRadius: radius['2xl'],
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.lg,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.md,
              }}
            >
              <Pressable
                onPress={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                hitSlop={8}
                style={{ padding: 6, borderRadius: radius.sm }}
              >
                <ChevronLeft size={18} color={colors.foreground} />
              </Pressable>
              <Text variant="bodyStrong">
                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </Text>
              <Pressable
                onPress={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                hitSlop={8}
                style={{ padding: 6, borderRadius: radius.sm }}
              >
                <ChevronRight size={18} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {WEEKDAY_LABELS.map((w) => (
                <View
                  key={w}
                  style={{
                    width: `${100 / 7}%`,
                    height: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text variant="caption" color="mutedForeground" style={{ fontWeight: '600' }}>
                    {w}
                  </Text>
                </View>
              ))}

              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <View key={`blank-${i}`} style={{ width: `${100 / 7}%`, height: 40 }} />
              ))}

              {days.map((day) => {
                const isSelected = !!selected && isSameDay(day, selected);
                const dayDisabled = isDisabledDay(day);
                const isToday = isSameDay(day, today);
                return (
                  <View
                    key={day.toISOString()}
                    style={{
                      width: `${100 / 7}%`,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Pressable
                      onPress={() => select(day)}
                      disabled={dayDisabled}
                      accessibilityRole="button"
                      accessibilityLabel={formatDisplay(day)}
                      accessibilityState={{ selected: isSelected, disabled: dayDisabled }}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: radius.sm,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        borderWidth: isToday && !isSelected ? 1 : 0,
                        borderColor: colors.primary,
                        opacity: dayDisabled ? 0.3 : 1,
                      }}
                    >
                      <Text
                        variant="callout"
                        style={{
                          color: isSelected ? colors.primaryForeground : colors.foreground,
                          fontWeight: isSelected ? '700' : '400',
                        }}
                      >
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={() => select(today)}
              accessibilityRole="button"
              style={{
                marginTop: spacing.md,
                paddingVertical: 8,
                alignItems: 'center',
                borderRadius: radius.sm,
              }}
            >
              <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
                Today
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
