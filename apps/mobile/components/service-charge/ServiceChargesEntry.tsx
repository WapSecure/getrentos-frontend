import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ReceiptText } from '@sureground/icons/native';
import { Card, Text, useTheme } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { statementsApi, type StatementKind } from '@/lib/api/serviceChargeStatements';

export function ServiceChargesEntry({ kind }: { kind: StatementKind }) {
  const { colors, spacing } = useTheme();
  const list = useQuery({
    queryKey: qk.statements.list(kind),
    queryFn: () => statementsApi.list(kind),
  });
  const count = list.data?.length ?? 0;
  if (count === 0) return null;
  const open = list.data!.filter((c) => c.openQueries > 0).length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Service charges, ${count}`}
      onPress={() =>
        router.push({ pathname: '/(app)/service-charge-statements', params: { kind } })
      }
    >
      {({ pressed }) => (
        <Card
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            opacity: pressed ? 0.92 : 1,
          }}
        >
          <ReceiptText size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Service charges</Text>
            <Text variant="caption" color="mutedForeground">
              {count} {count === 1 ? 'charge' : 'charges'}
              {open ? `, ${open} with an open query` : ''}. See how your share was worked out.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Card>
      )}
    </Pressable>
  );
}
