import { View, type ViewProps } from 'react-native';
import { useTheme } from '../theme';

export interface CardProps extends ViewProps {
  padding?: number | 'none';
  elevated?: boolean;
}

export function Card({ padding = 20, elevated = false, style, children, ...rest }: CardProps) {
  const { colors, radius, shadows } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          borderWidth: 1,
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
