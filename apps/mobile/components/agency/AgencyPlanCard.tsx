import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { PLAN_TIER_LABELS } from '@sureground/shared';
import { Card, Text, useTheme } from '@sureground/ui-native';
import { agencyFirmApi } from '@/lib/api/agencyFirm';
import { qk } from '@/lib/query/keys';
import { formatDate, formatNaira } from '@/lib/format';

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/** View only: Enterprise is arranged with the team, never sold or linked in the app. Renders nothing on an API without the plan endpoint. */
export function AgencyPlanCard() {
  const { spacing } = useTheme();
  const plan = useQuery({ queryKey: qk.agency.plan, queryFn: agencyFirmApi.plan, retry: false });
  const p = plan.data;
  if (!p) return null;

  const showTerms = p.enforced || Boolean(p.agreedTier);
  const startsOn = p.enforcedFrom ? ` on ${formatDate(p.enforcedFrom)}` : '';

  return (
    <Card style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">
        {showTerms ? `${PLAN_TIER_LABELS[p.agreedTier ?? p.tier]} plan` : 'Your plan'}
      </Text>
      {showTerms ? (
        <View style={{ gap: spacing.xs }}>
          <Fact
            label="Team seats"
            value={`${p.seatsUsed} of ${p.seats} used, counting open invitations`}
            warn={p.seatsUsed >= p.seats}
          />
          <Fact
            label="Managed units"
            value={`${p.unitsUsed} of ${p.units} used`}
            warn={p.unitsUsed >= p.units * 0.8}
          />
          {p.monthlyPriceKobo !== null ? (
            <Fact label="Agreed price" value={`${formatNaira(p.monthlyPriceKobo / 100)} a month`} />
          ) : null}
          {!p.enforced ? (
            <Text variant="caption" color="mutedForeground">
              Limits apply once agency plans start{startsOn}.
            </Text>
          ) : null}
        </View>
      ) : (
        <Text variant="caption" color="mutedForeground">
          Your firm has every Enterprise feature while agency plans are introduced
          {p.enforcedFrom ? `. Plans apply from ${formatDate(p.enforcedFrom)}` : ''}. You use{' '}
          {plural(p.seatsUsed, 'seat')} and {plural(p.unitsUsed, 'managed unit')} today.
        </Text>
      )}
    </Card>
  );
}

function Fact({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <View>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      <Text variant="callout" color={warn ? 'warning' : 'foreground'}>
        {value}
      </Text>
    </View>
  );
}
