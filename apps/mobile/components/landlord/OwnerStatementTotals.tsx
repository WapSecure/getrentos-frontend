import { View } from 'react-native';
import { Divider, Price, Text, useTheme } from '@sureground/ui-native';
import type { OwnerStatement } from '@/lib/api/landlord';

function Line({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
        {label}
      </Text>
      <Price amount={amount} variant="caption" />
    </View>
  );
}

/**
 * A statement's money: gross income, expenses, the management fee and the net payout, with the
 * ledger lines above them when `withLines` is set. Used by the owner statements and Managed screens.
 */
export function OwnerStatementTotals({
  statement: s,
  withLines = false,
}: {
  statement: Pick<
    OwnerStatement,
    'grossIncome' | 'totalExpenses' | 'managementFee' | 'netPayout' | 'lineItems'
  >;
  withLines?: boolean;
}) {
  const { spacing } = useTheme();
  const lines = withLines ? (s.lineItems ?? []) : [];
  return (
    <View style={{ gap: 4 }}>
      {lines.length ? (
        <View style={{ gap: 4, marginBottom: spacing.xs }}>
          {lines.map((item) => (
            <Line key={item.id} label={item.label} amount={item.amount} />
          ))}
          <Divider />
        </View>
      ) : null}
      <Line label="Gross income" amount={s.grossIncome} />
      <Line label="Expenses" amount={-s.totalExpenses} />
      <Line label="Management fee" amount={-s.managementFee} />
      <Divider />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="callout" style={{ fontWeight: '700' }}>
          Net payout
        </Text>
        <Price amount={s.netPayout} variant="bodyStrong" />
      </View>
    </View>
  );
}
