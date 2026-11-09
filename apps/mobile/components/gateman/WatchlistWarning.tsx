import { View } from 'react-native';
import { Eye } from '@sureground/icons/native';
import { Text, useTheme } from '@sureground/ui-native';

// Deliberately not the red refusal notice or an error: a WATCH entry admits the visitor on purpose.
export function WatchlistWarning({ warning }: { warning?: string }) {
  const { colors, spacing, radius } = useTheme();

  if (!warning) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        backgroundColor: colors.warningSubtle,
        borderRadius: radius.md,
        padding: spacing.md,
      }}
    >
      <Eye size={20} color={colors.warning} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" style={{ color: colors.warning }}>
          On the estate&apos;s watch list
        </Text>
        <Text variant="caption" color="mutedForeground">
          {warning}
        </Text>
      </View>
    </View>
  );
}
