import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Shared section hierarchy for dashboards, lists, and detail screens. */
export function SectionHeader({ title, description, actionLabel, onAction }: SectionHeaderProps) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md }}>
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <Text accessibilityRole="header" variant="heading">
          {title}
        </Text>
        {description ? (
          <Text variant="callout" color="mutedForeground">
            {description}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}, ${title}`}
          onPress={onAction}
          hitSlop={8}
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xxs }}
        >
          <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
            {actionLabel}
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}
