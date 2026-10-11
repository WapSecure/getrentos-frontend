import { View } from 'react-native';
import { router } from 'expo-router';
import { BadgeCheck, Sparkles } from 'lucide-react-native';
import { Button, Card, Text, useTheme } from '@getrentos/ui-native';

/**
 * What a Pro feature does, in place of the screen an estate on a lower plan
 * can't open: the API refuses it, so show the reason instead of an error.
 */
export function ProUpsell({
  title,
  description,
  perks,
}: {
  title: string;
  description: string;
  perks: string[];
}) {
  const { colors, spacing } = useTheme();
  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.infoSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles size={22} color={colors.primary} />
      </View>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="callout" color="mutedForeground">
        {description}
      </Text>
      {perks.map((p) => (
        <View key={p} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <BadgeCheck size={16} color={colors.success} style={{ marginTop: 2 }} />
          <Text variant="callout" style={{ flex: 1 }}>
            {p}
          </Text>
        </View>
      ))}
      <Button label="See Pro" onPress={() => router.push('/(app)/billing')} />
      <Text variant="caption" color="mutedForeground" center>
        The plan is the estate owner’s. If that isn’t you, ask them to upgrade.
      </Text>
    </Card>
  );
}
