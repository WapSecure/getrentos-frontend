import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Building2, Info, MessageCircleQuestion } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  FormAlert,
  IconButton,
  PressableScale,
  QueryState,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { useCustody } from '@/lib/agency/custody';
import {
  agencyApi,
  endedOn,
  formatDay,
  grantsNothing,
  hasEnded,
  noticeSummary,
  type AttentionItem,
} from '@/lib/api/agency';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName, formatNaira } from '@/lib/format';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { dashboardGreeting } from '@/components/dashboard/DashboardParts';
import { CustodyBar } from '@/components/agency/CustodyBar';
import { VerificationBanner } from '@/components/agency/VerificationBanner';

export default function AgencyHome() {
  const { colors, spacing } = useTheme();
  const { profile } = useAuth();
  const custody = useCustody();
  const dashboard = useQuery({ queryKey: qk.agency.dashboard, queryFn: agencyApi.dashboard });
  const attention = useQuery({ queryKey: qk.agency.attention, queryFn: agencyApi.attention });

  const refresh = () => {
    custody.reload();
    dashboard.refetch();
    attention.refetch();
  };

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={refresh}>
      <DashboardHeader
        eyebrow={dashboardGreeting()}
        title={firstName(profile?.legalName)}
        roleBadge="PM"
        subtitle={dashboard.data?.firmName ?? 'Your agency workspace'}
        accessory={
          <IconButton
            onPress={() => router.push({ pathname: '/(app)/ask', params: { persona: 'agency' } })}
            accessibilityLabel="Ask Sureground"
            icon={<MessageCircleQuestion size={21} color={colors.foreground} />}
          />
        }
      />
      <View style={{ gap: spacing.lg }}>
        <VerificationBanner />
        <CustodyBar />
        <Workspace />
        <Attention items={attention.data?.items ?? []} />
        <QueryState
          query={dashboard}
          skeleton={<Skeleton height={160} />}
          errorTitle="Firm figures did not load"
          errorDescription="Your clients and engagements are unaffected."
        >
          <FirmFigures />
        </QueryState>
      </View>
    </Screen>
  );
}

function Workspace() {
  const { spacing, colors } = useTheme();
  const { selected, live, loading } = useCustody();
  const props = useQuery({
    queryKey: qk.agency.managedProperties,
    queryFn: agencyApi.managedProperties,
    enabled: !!selected,
  });

  if (loading) return null;
  if (selected && hasEnded(selected)) {
    return (
      <Card style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">This engagement ended on {formatDay(endedOn(selected))}</Text>
        <Text variant="callout" color="mutedForeground">
          You can look back at it, but not act on the property.
        </Text>
        <Button
          label="View the engagement"
          size="sm"
          variant="secondary"
          onPress={() => router.push(`/(app)/agency-mandate/${selected.id}`)}
          style={{ alignSelf: 'flex-start' }}
        />
      </Card>
    );
  }
  if (live.length === 0) {
    return (
      <Card style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Nothing to act on yet</Text>
        <Text variant="callout" color="mutedForeground">
          An engagement has to be signed by both sides and verified by Sureground before you can act
          on the property.
        </Text>
        <Button
          label="See your engagements"
          size="sm"
          variant="secondary"
          onPress={() => router.push('/(app)/(manager)/engagements')}
          style={{ alignSelf: 'flex-start' }}
        />
      </Card>
    );
  }
  if (!selected) return null;

  const properties = (props.data ?? []).filter((p) => p.propertyId === selected.propertyId);
  return (
    <View style={{ gap: spacing.md }}>
      {grantsNothing(selected) ? (
        <FormAlert
          tone="warning"
          message="This engagement's scope grants no access to the property yet, so there is nothing you can do on it."
        />
      ) : null}
      {props.isLoading ? (
        <Skeleton height={90} />
      ) : properties.length === 0 ? (
        <Card padding={0}>
          <EmptyState
            size="compact"
            icon={<Building2 size={24} color={colors.mutedForeground} />}
            title="No property in this engagement yet"
            description={`The property shows here once it's added. For ${selected.ownerName ?? 'the owner'} · ${noticeSummary(selected)}`}
          />
        </Card>
      ) : (
        properties.map((p) => (
          <PressableScale
            key={p.propertyId}
            onPress={() => router.push(`/(app)/landlord-units?property=${p.propertyId}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${p.title}`}
          >
            <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
              <Building2 size={22} color={colors.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {p.title}
                </Text>
                <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                  {p.address}, {p.city}
                </Text>
                <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                  Open the property
                </Text>
              </View>
            </Card>
          </PressableScale>
        ))
      )}
      <Button
        label="Engagement details"
        size="sm"
        variant="ghost"
        onPress={() => router.push(`/(app)/agency-mandate/${selected.id}`)}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  );
}

const SEVERITY = {
  urgent: { tone: 'destructive' as const, Icon: AlertTriangle },
  soon: { tone: 'warning' as const, Icon: AlertTriangle },
  info: { tone: 'info' as const, Icon: Info },
};

function mobileRoute(path: string): string | null {
  if (path.startsWith('/agency/mandates/')) return `/(app)/agency-mandate/${path.split('/').pop()}`;
  if (path.startsWith('/agency/mandates')) return '/(app)/(manager)/engagements';
  if (path.startsWith('/agency/queries')) return '/(app)/(manager)/questions';
  if (path.startsWith('/agency/owners/')) return `/(app)/agency-client/${path.split('/').pop()}`;
  if (path.startsWith('/agency/owners')) return '/(app)/(manager)/clients';
  return null;
}

function Attention({ items }: { items: AttentionItem[] }) {
  const { colors, spacing } = useTheme();
  if (items.length === 0) return null;
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">Needs attention</Text>
      {items.map((item) => {
        const { tone, Icon } = SEVERITY[item.severity] ?? SEVERITY.info;
        const route = item.link ? mobileRoute(item.link.path) : null;
        const body = (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Icon size={16} color={colors[tone]} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="callout" style={{ fontWeight: '600' }}>
                {item.title}
              </Text>
              {item.detail ? (
                <Text variant="caption" color="mutedForeground">
                  {item.detail}
                </Text>
              ) : null}
              {route && item.link ? (
                <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                  {item.link.label} →
                </Text>
              ) : null}
            </View>
          </View>
        );
        return route ? (
          <PressableScale
            key={item.key}
            onPress={() => router.push(route as never)}
            accessibilityRole="link"
          >
            {body}
          </PressableScale>
        ) : (
          <View key={item.key}>{body}</View>
        );
      })}
    </Card>
  );
}

function FirmFigures() {
  const { colors, spacing, radius } = useTheme();
  const q = useQuery({ queryKey: qk.agency.dashboard, queryFn: agencyApi.dashboard });
  const d = q.data;
  if (!d) return <Skeleton height={160} />;
  const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v)}%`);
  const tiles = [
    {
      label: 'Clients',
      value: String(d.clients.active),
      note: `${d.clients.pending} pending${d.clients.endedLast90Days ? ` · ${d.clients.endedLast90Days} ended (90 days)` : ''}`,
    },
    {
      label: 'Occupancy',
      value: pct(d.portfolio.occupancyRate),
      note: `${d.portfolio.occupiedUnits} of ${d.portfolio.units} units · ${d.portfolio.properties} properties`,
    },
    {
      label: 'Rent this month',
      value: pct(d.rentThisMonth.collectionRate),
      note: `${formatNaira(d.rentThisMonth.collected)} of ${formatNaira(d.rentThisMonth.due)}`,
    },
    {
      label: 'Commission this month',
      value: formatNaira(d.commissionsThisMonth),
      note: `${d.team.active} on the team`,
    },
  ];
  const aging = [
    ['0–30 days', d.arrears.aging.days0to30],
    ['31–60 days', d.arrears.aging.days31to60],
    ['61–90 days', d.arrears.aging.days61to90],
    ['90+ days', d.arrears.aging.days90plus],
  ] as const;
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="heading">The firm this month</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {tiles.map((t) => (
          <Card
            key={t.label}
            padding={spacing.md}
            style={{ flexBasis: '47%', flexGrow: 1, gap: 2 }}
          >
            <Text variant="caption" color="mutedForeground">
              {t.label}
            </Text>
            <Text variant="heading">{t.value}</Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={2}>
              {t.note}
            </Text>
          </Card>
        ))}
      </View>
      <Card style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Arrears {formatNaira(d.arrears.total)}</Text>
        {d.arrears.total === 0 ? (
          <Text variant="caption" color="mutedForeground">
            Nobody is behind on rent.
          </Text>
        ) : (
          aging.map(([label, amount]) => (
            <View key={label} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption" color="mutedForeground">
                  {label}
                </Text>
                <Text variant="caption">{formatNaira(amount)}</Text>
              </View>
              <View
                style={{ height: 6, borderRadius: radius.full, backgroundColor: colors.secondary }}
              >
                <View
                  style={{
                    width: `${(amount / d.arrears.total) * 100}%`,
                    height: '100%',
                    borderRadius: radius.full,
                    backgroundColor: colors.warning,
                  }}
                />
              </View>
            </View>
          ))
        )}
      </Card>
      <Card style={{ gap: 4 }}>
        <Text variant="bodyStrong">Maintenance</Text>
        <Text variant="callout" color="mutedForeground">
          {d.maintenance.open} open · {d.maintenance.resolvedThisMonth} resolved this month
        </Text>
        {d.maintenance.slaBreached > 0 ? (
          <Text variant="callout" style={{ color: colors.warning, fontWeight: '600' }}>
            {d.maintenance.slaBreached} past their response deadline
          </Text>
        ) : null}
      </Card>
    </View>
  );
}
