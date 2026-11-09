import { Pressable, View } from 'react-native';
import { Star } from '@sureground/icons/native';
import { useTheme } from '@sureground/ui-native';

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  disabled?: boolean;
}

export function StarRating({ value, onChange, size = 28, disabled = false }: Props) {
  const { colors } = useTheme();
  const readOnly = !onChange;

  return (
    <View style={{ flexDirection: 'row', gap: readOnly ? 2 : 6 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const icon = (
          <Star
            size={size}
            color={filled ? colors.warning : colors.mutedForeground}
            fill={filled ? colors.warning : 'transparent'}
          />
        );
        if (readOnly) return <View key={star}>{icon}</View>;
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
            accessibilityState={{ selected: filled, disabled }}
            hitSlop={4}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}
