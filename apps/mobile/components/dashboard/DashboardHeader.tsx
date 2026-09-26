import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Text, useTheme } from '@getrentos/ui-native';

type DashboardHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function DashboardHeader({
  eyebrow,
  title,
  subtitle,
  accessory,
  style,
}: DashboardHeaderProps) {
  const { spacing } = useTheme();
  return (
    <View
      accessibilityRole="header"
      style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }, style]}
    >
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <Text variant="label" color="primary" uppercase>
          {eyebrow}
        </Text>
        <Text variant="title">{title}</Text>
        {subtitle ? (
          <Text variant="callout" color="mutedForeground">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {accessory}
    </View>
  );
}
