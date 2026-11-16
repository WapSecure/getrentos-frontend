import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SERVICE_CHARGE_ACTUAL_SOURCE_LABELS,
  actualLinkBody,
  formatCurrency,
  varianceLabel,
} from '@sureground/shared';
import {
  Button,
  Card,
  Chip,
  ListSkeleton,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { errorMessage } from '@/lib/api/client';
import { serviceChargesApi } from '@/lib/api/serviceCharges';
import { formatDay } from '@/lib/serviceCharge';

export function ReconciliationSection({
  budgetId,
  editable,
}: {
  budgetId: string;
  editable: boolean;
}) {
  const { spacing, colors } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const key = [...qk.homeCare.serviceCharge(budgetId), 'reconciliation'];
  const candidatesKey = [...qk.homeCare.serviceCharge(budgetId), 'candidates'];
  const rec = useQuery({
    queryKey: key,
    queryFn: () => serviceChargesApi.reconciliation(budgetId),
  });
  const [counting, setCounting] = useState(false);
  const [lineFor, setLineFor] = useState<Record<string, string>>({});
  const candidates = useQuery({
    queryKey: candidatesKey,
    queryFn: () => serviceChargesApi.actualCandidates(budgetId),
    enabled: counting,
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: candidatesKey });
  };
  const link = useMutation({
    mutationFn: (c: {
      source: 'UTILITY_PURCHASE' | 'EXPENSE' | 'VENDOR_INVOICE';
      id: string;
      lineId: string;
    }) => serviceChargesApi.linkActual(budgetId, actualLinkBody(c.lineId, c)),
    onSuccess: () => {
      refresh();
      toast.show('Counted.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not count it.'), 'error'),
  });
  const unlink = useMutation({
    mutationFn: (linkId: string) => serviceChargesApi.unlinkActual(budgetId, linkId),
    onSuccess: refresh,
    onError: (e) => toast.show(errorMessage(e, 'Could not remove it.'), 'error'),
  });
  const data = rec.data;
  const lines = (data?.lines ?? []).filter((l) => !l.retired);

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading" headingLevel={2}>
        Budget against actual
      </Text>
      <QueryState query={rec} skeleton={<ListSkeleton rows={3} />}>
        {data ? (
          <Card style={{ gap: spacing.md }}>
            <Figure
              label="Spent so far"
              value={formatCurrency(data.totals.actual)}
              hint={varianceLabel(data.totals.variance)}
            />
            <Figure label="Billed" value={formatCurrency(data.totals.billed)} />
            <Figure
              label="Collected in cash"
              value={formatCurrency(data.totals.collected)}
              hint={[
                data.totals.credited > 0
                  ? `${formatCurrency(data.totals.credited)} settled by credits`
                  : '',
                data.totals.outstanding > 0
                  ? `${formatCurrency(data.totals.outstanding)} still to pay`
                  : '',
              ]
                .filter(Boolean)
                .join(', ')}
            />
            <Figure label="Owner bears (vacant)" value={formatCurrency(data.totals.ownerBears)} />
            {data.lines.map((line) => (
              <View
                key={line.id}
                style={{
                  gap: 4,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: spacing.sm,
                }}
              >
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
                    {line.label}
                  </Text>
                  <Text variant="callout">
                    {formatCurrency(line.actual)} of {formatCurrency(line.budget)}
                  </Text>
                </View>
                <Text
                  variant="caption"
                  color={line.variance < 0 ? 'destructive' : 'mutedForeground'}
                >
                  {varianceLabel(line.variance)}
                </Text>
                {line.items.map((item) => (
                  <View
                    key={item.id}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                  >
                    <Text
                      variant="caption"
                      color="mutedForeground"
                      style={{ flex: 1 }}
                      numberOfLines={1}
                    >
                      {formatDay(item.date)} · {item.description}
                    </Text>
                    <Text variant="caption">{formatCurrency(item.amount)}</Text>
                    {editable ? (
                      <Button
                        label="Remove"
                        variant="ghost"
                        size="sm"
                        onPress={() => unlink.mutate(item.id)}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </Card>
        ) : null}
      </QueryState>
      {editable ? (
        counting ? (
          <Card style={{ gap: spacing.md }}>
            <Text variant="bodyStrong">Count spend</Text>
            <QueryState
              query={candidates}
              skeleton={<ListSkeleton rows={3} />}
              isEmpty={!candidates.data?.length}
              empty={{
                title: 'Nothing left to count',
                description: 'Log fuel, expenses or approve invoices and they appear here.',
              }}
            >
              {(candidates.data ?? []).map((c) => {
                const chosen = lineFor[c.id] ?? lines[0]?.id ?? '';
                return (
                  <View
                    key={c.id}
                    style={{
                      gap: spacing.xs,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      paddingTop: spacing.sm,
                    }}
                  >
                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                      <Text variant="callout" style={{ flex: 1 }} numberOfLines={2}>
                        {c.description}
                      </Text>
                      <Text variant="callout">{formatCurrency(c.amount)}</Text>
                    </View>
                    <Text variant="caption" color="mutedForeground">
                      {SERVICE_CHARGE_ACTUAL_SOURCE_LABELS[c.source]} · {formatDay(c.date)}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                      {lines.map((l) => (
                        <Chip
                          key={l.id}
                          label={l.label}
                          selected={chosen === l.id}
                          onPress={() => setLineFor((all) => ({ ...all, [c.id]: l.id }))}
                        />
                      ))}
                    </View>
                    <Button
                      label="Count against this line"
                      size="sm"
                      variant="secondary"
                      disabled={!chosen || link.isPending}
                      loading={link.isPending && link.variables?.id === c.id}
                      onPress={() => link.mutate({ source: c.source, id: c.id, lineId: chosen })}
                    />
                  </View>
                );
              })}
            </QueryState>
            <Button label="Done" variant="ghost" onPress={() => setCounting(false)} />
          </Card>
        ) : (
          <Button label="Count spend" variant="secondary" onPress={() => setCounting(true)} />
        )
      ) : null}
    </View>
  );
}

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <Text variant="callout" color="mutedForeground">
          {label}
        </Text>
        {hint ? (
          <Text variant="caption" color="mutedForeground">
            {hint}
          </Text>
        ) : null}
      </View>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}
