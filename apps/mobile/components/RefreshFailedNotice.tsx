import { Pressable, View } from 'react-native';
import { RotateCw } from '@sureground/icons/native';
import { Text, useTheme } from '@sureground/ui-native';

export function RefreshFailedNotice({
  onRetry,
  retrying,
  style,
}: {
  onRetry: () => void;
  retrying?: boolean;
  style?: object;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.warningSubtle,
        },
        style,
      ]}
    >
      <Text variant="caption" style={{ flex: 1 }}>
        Couldn’t refresh. You may be seeing older information.
      </Text>
      <Pressable
        onPress={onRetry}
        disabled={retrying}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        hitSlop={8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: retrying ? 0.5 : 1 }}
      >
        <RotateCw size={14} color={colors.primary} />
        <Text variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
          {retrying ? 'Retrying…' : 'Try again'}
        </Text>
      </Pressable>
    </View>
  );
}
