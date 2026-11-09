import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Badge, Text, useTheme } from '@sureground/ui-native';

type DashboardHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  roleBadge?: string;
  accessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Makes the title block a button (e.g. "Switch estate"). Only the title: the
   * accessory stays outside it, so its own buttons are never nested in this one.
   */
  onTitlePress?: () => void;
  titleAccessibilityLabel?: string;
};

export function DashboardHeader({
  eyebrow,
  title,
  subtitle,
  roleBadge,
  accessory,
  style,
  onTitlePress,
  titleAccessibilityLabel,
}: DashboardHeaderProps) {
  const { spacing } = useTheme();
  const TitleBlock = onTitlePress ? Pressable : View;
  return (
    <View
      accessibilityRole="header"
      style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }, style]}
    >
      <TitleBlock
        style={{ flex: 1, gap: spacing.xxs }}
        {...(onTitlePress
          ? {
              onPress: onTitlePress,
              accessibilityRole: 'button' as const,
              accessibilityLabel: titleAccessibilityLabel,
            }
          : {})}
      >
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
      </TitleBlock>
      {accessory}
    </View>
  );
}
