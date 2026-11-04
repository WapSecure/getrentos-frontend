import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, ChevronRight, FileSignature } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  FormAlert,
  ListSkeleton,
  PressableScale,
  Screen,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { useCustody } from '@/lib/agency/custody';
import {
  agencyApi,
  formatDay,
  grantsNothing,
  isLive,
  MANDATE_STATUS,
  managerLabel,
  noticeSummary,
  type AgencyTransfer,
  type Mandate,
} from '@/lib/api/agency';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MandateActions } from '@/components/agency/MandateActions';

/** Every engagement the manager holds, with what each lets them do and what's next. */
export default function AgencyEngagements() {
  const { colors, spacing } = useTheme();
  const custody = useCustody();
  const transfers = useQuery({ queryKey: qk.agency.transfers, queryFn: agencyApi.transfers });
  const ordered = [...custody.mandates].sort(
    (a, b) =>
      Number(isLive(b)) - Number(isLive(a)) || Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );

  return (
    <Screen
      refreshing={false}
      onRefresh={() => {
        custody.reload();
        transfers.refetch();
      }}
    >
      <DashboardHeader
        eyebrow="Agency"
        title="Engagements"
        subtitle={`${custody.live.length} you can act under right now`}
      />
      <View style={{ gap: spacing.md }}>
        <Transfers transfers={transfers.data ?? []} />
        {custody.loading ? (
          <ListSkeleton rows={3} variant="card" height={140} />
        ) : custody.error && !custody.mandates.length ? (
          <ErrorState description={custody.error} onRetry={custody.reload} />
        ) : ordered.length === 0 ? (
          <EmptyState
            icon={<FileSignature size={32} color={colors.mutedForeground} />}
            title="No client engagements yet"
            description="An engagement appears here once an owner appoints your firm, or you send one for them to sign."
          />
        ) : (
          ordered.map((m) => <MandateCard key={m.id} mandate={m} />)
        )}
      </View>
    </Screen>
  );
}

function Transfers({ transfers }: { transfers: AgencyTransfer[] }) {
  const { colors, spacing } = useTheme();
  const shown = transfers.filter((t) => t.status === 'OPEN' || t.status === 'SWITCHED');
  if (!shown.length) return null;
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <ArrowRightLeft size={16} color={colors.primary} />
        <Text variant="bodyStrong">Changes of manager</Text>
      </View>
      {shown.map((t) => (
        <View key={t.id} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="callout" style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
              {t.propertyName}
            </Text>
            <Badge
              label={t.status === 'OPEN' ? 'Scheduled' : 'Taken effect'}
              tone={t.status === 'OPEN' ? 'info' : 'success'}
            />
          </View>
          <Text variant="caption" color="mutedForeground">
            {t.outgoing?.manager ?? 'The owner'} → {t.incoming.manager} · {formatDay(t.effectiveAt)}
          </Text>
          {t.status === 'OPEN' && !t.incoming.mandateId && t.incoming.manager !== 'the owner' ? (
            <Text variant="caption" style={{ color: colors.warning }}>
              The incoming engagement has not been set up yet.
            </Text>
          ) : null}
          {t.status === 'SWITCHED' ? (
            <PressableScale
              onPress={() => router.push(`/(app)/handover/${t.id}`)}
              accessibilityRole="link"
            >
              <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                Handover pack →
              </Text>
            </PressableScale>
          ) : null}
        </View>
      ))}
    </Card>
  );
}

const CAPS: [keyof Mandate['capabilities'], string][] = [
  ['canList', 'list'],
  ['canManage', 'manage'],
  ['canTransact', 'money'],
];

function MandateCard({ mandate: m }: { mandate: Mandate }) {
  const { colors, spacing } = useTheme();
  const status = MANDATE_STATUS[m.status];
  return (
    <Card style={{ gap: spacing.sm }}>
      <PressableScale
        onPress={() => router.push(`/(app)/agency-mandate/${m.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${m.propertyTitle ?? 'Property'}, ${status.label}. Details`}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={2}>
              {m.propertyTitle ?? 'Property'}
            </Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={2}>
              {m.ownerName ?? 'Owner'} · {managerLabel(m)} · {noticeSummary(m)}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </View>
      </PressableScale>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Badge label={status.label} tone={status.tone} />
        {isLive(m) ? <Badge label="In force" tone="success" /> : null}
      </View>
      <Text variant="caption" color="mutedForeground">
        Scope: {m.scope.map((s) => s.toLowerCase()).join(', ') || 'none'} · may{' '}
        {CAPS.filter(([k]) => m.capabilities[k])
          .map(([, l]) => l)
          .join(', ') || 'do nothing yet'}
      </Text>
      {grantsNothing(m) ? (
        <Text variant="caption" style={{ color: colors.warning }}>
          This engagement grants no access to the property yet.
        </Text>
      ) : null}
      {m.status === 'PENDING_OPS' ? (
        <FormAlert
          tone="info"
          message="Both sides have signed. A GetRentos officer still has to verify it before you can act."
        />
      ) : null}
      <MandateActions mandate={m} />
    </Card>
  );
}
