import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useReducedMotion } from '../accessibility';
import { Text } from './Text';

export interface TimeFieldProps {
  /** 24-hour time, `HH:mm`. */
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  /** Minutes between slots (default 30). */
  stepMinutes?: number;
  /** First selectable hour, inclusive (default 8). */
  startHour?: number;
  /** Last selectable hour, exclusive (default 20). */
  endHour?: number;
  error?: string | null;
  hint?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

function buildSlots(startHour: number, endHour: number, step: number): string[] {
  const slots: string[] = [];
  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += step) {
    const h = `${Math.floor(minutes / 60)}`.padStart(2, '0');
    const m = `${minutes % 60}`.padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
}

/** Renders `HH:mm` as a 12-hour label, e.g. `14:30` → `2:30 PM`. */
export function formatTimeLabel(value: string): string {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${`${m}`.padStart(2, '0')} ${period}`;
}

/** Time input that opens a grid of bookable slots, styled to match `DateField`. */
export function TimeField({
  value,
  onChange,
  label,
  placeholder = 'Select time',
  stepMinutes = 30,
  startHour = 8,
  endHour = 20,
  error,
  hint,
  disabled,
  containerStyle,
}: TimeFieldProps) {
  const { colors, radius, spacing } = useTheme();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  const slots = buildSlots(startHour, endHour, stepMinutes);

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
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        accessibilityHint={error ? `Error: ${error}` : hint}
        accessibilityState={{ disabled }}
        aria-invalid={!!error}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          minHeight: 54,
          borderRadius: radius.md,
          backgroundColor: colors.secondary,
          borderWidth: 1.5,
          borderColor: error ? colors.destructive : 'transparent',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text variant="body" color={value ? 'foreground' : 'mutedForeground'} style={{ flex: 1 }}>
          {value ? formatTimeLabel(value) : placeholder}
        </Text>
        <Clock size={18} color={colors.mutedForeground} />
      </Pressable>

      {error ? (
        <Text
          variant="caption"
          color="destructive"
          accessibilityLiveRegion="polite"
          style={{ marginLeft: 4 }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="mutedForeground" style={{ marginLeft: 4 }}>
          {hint}
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType={reduceMotion ? 'none' : 'fade'}
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <Pressable
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close time picker"
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            accessibilityLabel="Time picker"
            style={{
              width: 320,
              maxWidth: '90%',
              maxHeight: '70%',
              borderRadius: radius['2xl'],
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.lg,
            }}
          >
            <Text variant="bodyStrong" style={{ marginBottom: spacing.md }}>
              Pick a time
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {slots.map((slot) => {
                  const isSelected = slot === value;
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => {
                        onChange(slot);
                        setOpen(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={formatTimeLabel(slot)}
                      accessibilityState={{ selected: isSelected }}
                      style={{
                        minHeight: 44,
                        paddingVertical: 9,
                        paddingHorizontal: 14,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      }}
                    >
                      <Text
                        variant="callout"
                        style={{
                          color: isSelected ? colors.primaryForeground : colors.foreground,
                          fontWeight: isSelected ? '700' : '400',
                        }}
                      >
                        {formatTimeLabel(slot)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
