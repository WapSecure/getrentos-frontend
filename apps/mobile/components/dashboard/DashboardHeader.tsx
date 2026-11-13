import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text, useTheme, withAlpha } from '@sureground/ui-native';

type DashboardHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  roleBadge?: string;
  accessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Only the title is the button: the accessory stays outside it, so its own buttons are never nested in this one. */
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
          {roleBadge ? <RoleChip label={roleBadge} /> : null}
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

/** The workspace's role initials ("LL", "RT") as a small Sureground blue chip beside the name. */
function RoleChip({ label }: { label: string }) {
  const { colors, radius, scheme } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: withAlpha(colors.primary, 0.32),
        backgroundColor: withAlpha(colors.primary, scheme === 'dark' ? 0.2 : 0.1),
      }}
    >
      <Text
        variant="caption"
        maxFontSizeMultiplier={1.4}
        style={{ color: colors.primary, fontWeight: '800', letterSpacing: 0.8 }}
      >
        {label}
      </Text>
    </View>
  );
}
