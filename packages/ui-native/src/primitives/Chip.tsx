import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme, withAlpha } from '../theme';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leadingIcon?: ReactNode;
  count?: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Chip({
  label,
  selected = false,
  onPress,
  leadingIcon,
  count,
  disabled = false,
  size = 'md',
}: ChipProps) {
  const { colors, radius, scheme } = useTheme();
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
        // Selected is Sureground blue: a soft tint of the primary, never a neutral or ink fill.
        backgroundColor: selected
          ? withAlpha(colors.primary, scheme === 'dark' ? 0.2 : 0.1)
          : colors.card,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {leadingIcon}
      <Text
        variant={size === 'sm' ? 'caption' : 'callout'}
        style={{
          fontWeight: '600',
          color: selected ? colors.primary : colors.foreground,
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
              fontSize: 12,
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
      accessibilityLabel={typeof count === 'number' && count > 0 ? `${label}, ${count}` : label}
      accessibilityState={{ selected, disabled }}
      hitSlop={6}
      style={({ pressed }) => ({
        minHeight: 44,
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {body}
    </Pressable>
  );
}
