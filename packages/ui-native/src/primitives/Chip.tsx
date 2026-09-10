import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  /** Filled/tinted when true. */
  selected?: boolean;
  /** Tappable when provided; otherwise a static tag. */
  onPress?: () => void;
  leadingIcon?: ReactNode;
  /** Small trailing count, e.g. active-filter total. */
  count?: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/**
 * A pill for filters, sorts, specs and amenities. Selected chips take the
 * primary tint; unselected ones are a bordered surface. Static (no `onPress`)
 * chips render as plain tags.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  leadingIcon,
  count,
  disabled = false,
  size = 'md',
}: ChipProps) {
  const { colors, radius } = useTheme();
  const pad = size === 'sm' ? { v: 5, h: 10, gap: 5 } : { v: 8, h: 13, gap: 6 };

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: pad.gap,
        paddingVertical: pad.v,
        paddingHorizontal: pad.h,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.accent : colors.card,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {leadingIcon}
      <Text
        variant={size === 'sm' ? 'caption' : 'callout'}
        style={{
          fontWeight: '600',
          color: selected ? colors.accentForeground : colors.foreground,
        }}
      >
        {label}
      </Text>
      {typeof count === 'number' && count > 0 ? (
        <View
          style={{
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            paddingHorizontal: 4,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? colors.primary : colors.secondary,
          }}
        >
          <Text
            variant="caption"
            style={{
              fontSize: 10.5,
              fontWeight: '700',
              color: selected ? colors.primaryForeground : colors.mutedForeground,
            }}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      hitSlop={6}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {body}
    </Pressable>
  );
}
