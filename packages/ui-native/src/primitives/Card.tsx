import { View, type ViewProps } from 'react-native';
import { useTheme } from '../theme';

export interface CardProps extends ViewProps {
  padding?: number | 'none';
  elevated?: boolean;
}

/** Surface container. The default padding is `lg` (16); pass `"none"` for lists. */
export function Card({ padding = 16, elevated = false, style, children, ...rest }: CardProps) {
  const { colors, radius, shadows } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderWidth: elevated ? 0 : 1,
          borderColor: colors.border,
          padding: padding === 'none' ? 0 : padding,
          overflow: 'hidden',
        },
        elevated && shadows.sm,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
