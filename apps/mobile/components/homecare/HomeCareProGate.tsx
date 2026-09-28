import { View } from 'react-native';
import { router } from 'expo-router';
import { BadgeCheck, Wrench } from 'lucide-react-native';
import { Button, Card, Text, useTheme } from '@getrentos/ui-native';

/** Home care is Pro: show what it does instead of an error. */
export function HomeCareProGate() {
  const { colors, spacing } = useTheme();
  const perks = [
    'Work orders with response and repair deadlines per priority',
    'Vendor quotes, spend approval and invoices in one place',
    'Asset register with warranties and preventive servicing',
    'Emergencies escalate automatically when a deadline slips',
  ];
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
        <Wrench size={22} color={colors.primary} />
      </View>
      <Text variant="heading">Home care is part of Pro</Text>
      {perks.map((p) => (
        <View key={p} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <BadgeCheck size={16} color={colors.success} style={{ marginTop: 2 }} />
          <Text variant="callout" style={{ flex: 1 }}>
            {p}
          </Text>
        </View>
      ))}
      <Button label="See Pro" onPress={() => router.push('/(app)/billing')} />
    </Card>
  );
}
