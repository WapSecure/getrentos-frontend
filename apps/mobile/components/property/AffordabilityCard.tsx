import { useState } from 'react';
import { View } from 'react-native';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  CurrencyField,
  Skeleton,
  Text,
  useTheme,
  type BadgeTone,
} from '@getrentos/ui-native';
import {
  rentDecisionApi,
  type Affordability,
  type AffordabilityInput,
} from '@/lib/api/rentDecision';

const BAND: Record<Affordability['band'], { label: string; tone: BadgeTone } | null> = {
  comfortable: { label: 'Comfortable', tone: 'success' },
  stretched: { label: 'A stretch', tone: 'warning' },
  high: { label: 'Hard to keep up', tone: 'danger' },
  unknown: null,
};

/**
 * "Can I afford it?" on the phone: rent against income (the same rule landlord
 * screening uses), cash to move in, and how long saving it takes. Worked out
 * by GetRentos; what is entered is used for this answer only.
 */
export function AffordabilityCard({ listingId }: { listingId: string }) {
  const { colors, spacing, radius } = useTheme();
  const [form, setForm] = useState<AffordabilityInput>({});
  const [asked, setAsked] = useState<AffordabilityInput>({});
  const q = useQuery({
    queryKey: ['renter', 'listing', listingId, 'affordability', asked],
    queryFn: () => rentDecisionApi.affordability(listingId, asked),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    retry: false,
  });
  if (q.isLoading && !q.data) return <Skeleton height={140} radius={radius.md} />;
  const d = q.data;
  if (!d) return null;
  const band = BAND[d.band];

  return (
    <Card elevated padding={spacing.lg}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Wallet size={18} color={colors.primary} />
          <Text variant="bodyStrong" headingLevel={2} style={{ flex: 1 }}>
            Can I afford it?
          </Text>
          {band ? <Badge label={band.label} tone={band.tone} /> : null}
        </View>
        <Text variant="callout">{d.verdict}</Text>
        {d.incomeSource === 'last_application' ? (
          <Text variant="caption" color="mutedForeground">
            Using the monthly income from your last application.
          </Text>
        ) : null}
        <Text variant="caption" color="mutedForeground">
          Rent {d.rent.amount} {d.rent.period} · Deposit {d.moveIn.deposit ?? 'none stated'}
        </Text>
        <Text variant="label">Cash to move in: {d.moveIn.total}</Text>
        {d.savingPlan ? <Text variant="caption">{d.savingPlan}</Text> : null}

        <CurrencyField
          label="Monthly income"
          value={form.monthlyIncome ?? null}
          onValueChange={(v) => setForm((f) => ({ ...f, monthlyIncome: v }))}
        />
        <CurrencyField
          label="Savings so far (optional)"
          value={form.savings ?? null}
          onValueChange={(v) => setForm((f) => ({ ...f, savings: v }))}
        />
        <CurrencyField
          label="Can save each month (optional)"
          value={form.monthlySaving ?? null}
          onValueChange={(v) => setForm((f) => ({ ...f, monthlySaving: v }))}
        />
        <Button label="Work it out" variant="secondary" size="sm" onPress={() => setAsked(form)} />

        <Text variant="label">Ask the landlord about</Text>
        {d.toAsk.map((t) => (
          <Text key={t} variant="caption" color="mutedForeground">
            • {t}
          </Text>
        ))}
        <Text variant="caption" color="mutedForeground">
          What you enter is used for this answer only and is not saved.
        </Text>
      </View>
    </Card>
  );
}
