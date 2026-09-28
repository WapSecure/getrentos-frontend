import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Badge, Text, useTheme } from '@getrentos/ui-native';

type DashboardHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  roleBadge?: string;
  accessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function DashboardHeader({
  eyebrow,
  title,
  subtitle,
  roleBadge,
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
        <View
          style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}
        >
          <Text variant="title">{title}</Text>
          {roleBadge ? <Badge label={roleBadge} tone="info" /> : null}
        </View>
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
