import { View } from 'react-native';
import { router } from 'expo-router';
import { BadgeCheck, Sparkles } from '@sureground/icons/native';
import { Button, Card, Text, useTheme } from '@sureground/ui-native';

export function ProUpsell({
  title,
  description,
  perks,
  note = 'The plan is the estate owner’s. If that isn’t you, ask them to upgrade.',
}: {
  title: string;
  description: string;
  perks: string[];
  note?: string | null;
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
      <Text variant="heading" headingLevel={2}>
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
      {note ? (
        <Text variant="caption" color="mutedForeground" center>
          {note}
        </Text>
      ) : null}
    </Card>
  );
}
