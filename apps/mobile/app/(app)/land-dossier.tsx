import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { boundarySignOffText } from '@getrentos/shared';
import {
  Badge,
  Card,
  DetailSkeleton,
  Divider,
  FormAlert,
  QueryState,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  COST_STATUS,
  costFigure,
  estimatedTotal,
  landDossierApi,
  words,
  type DossierTarget,
  type LandDossier,
} from '@/lib/api/landDossier';
import { LAND_TITLE_TYPE_LABEL, type LandTitleType } from '@/lib/api/land';
import { formatDate, formatNaira } from '@/lib/format';
import { TrustChecks } from '@/components/land/TrustChecks';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/**
 * The buyer's decision dossier: what the land is, what was and wasn't checked,
 * the all-in cost, and the title's history. Opened from a land listing (resale)
 * or before starting an estate plot purchase (with the chosen plan).
 */
export default function LandDossierScreen() {
  const params = useLocalSearchParams<{
    listingId?: string;
    layoutId?: string;
    plotId?: string;
    planId?: string;
  }>();
  const target: DossierTarget | null = params.listingId
    ? { kind: 'listing', listingId: params.listingId }
    : params.layoutId
      ? { kind: 'estate', layoutId: params.layoutId, plotId: params.plotId, planId: params.planId }
      : null;
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: qk.land.dossier(JSON.stringify(target)),
    queryFn: () => landDossierApi.get(target!),
    enabled: !!target,
  });
  const d = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Decision dossier"
        title={d?.subject.title ?? 'Land'}
        subtitle={
          d
            ? `${d.subject.city}, ${d.subject.state} · ${formatNaira(d.subject.price)}${d.subject.planName ? ` · ${d.subject.planName}` : ''}`
            : undefined
        }
        onBack={() => goBack()}
      />
      <QueryState
        query={q}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl }}>
            <DetailSkeleton />
          </View>
        }
        errorTitle="The dossier did not load"
        style={{ paddingHorizontal: spacing.xl }}
      >
        {d ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.md,
            }}
          >
            <FormAlert tone="warning" message={d.freshnessNote} />
            <TheLand d={d} />
            <Section title="What was checked, and what was not">
              <TrustChecks tier={d.assuranceTier} labels={d.labels} notVerified={d.notVerified} />
              {d.checklist.policyPack ? (
                <Text variant="caption" color="mutedForeground">
                  Checked against {d.checklist.policyPack.state} rules
                  {d.checklist.policyPack.status === 'APPROVED'
                    ? ''
                    : ' (draft, pending counsel review)'}
                  .
                </Text>
              ) : null}
            </Section>
            <AllInCost cost={d.acquisitionCost} />
            <Section title="Title history">
              {d.titleChronology.length === 0 ? (
                <Text variant="callout" color="mutedForeground">
                  No chain of title has been recorded yet.
                </Text>
              ) : (
                d.titleChronology.map((e, i) => (
                  <View key={`${e.kind}-${i}`} style={{ gap: 2 }}>
                    <Text variant="callout" style={{ fontWeight: '600' }}>
                      {words(e.kind)}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {formatDate(e.occurredAt, 'short')}
                      {e.registeredAt ? ` · registered ${formatDate(e.registeredAt, 'short')}` : ''}
                    </Text>
                    <Badge
                      label={e.verified ? 'Verified by GetRentos' : 'As stated by the owner'}
                      tone={e.verified ? 'success' : 'neutral'}
                    />
                  </View>
                ))
              )}
            </Section>
            <Section title="Sources">
              <Text variant="callout" color="mutedForeground">
                Documents GetRentos holds for this land (the files are not shared here):{' '}
                {d.sourceIndex.length === 0
                  ? 'none on file.'
                  : d.sourceIndex
                      .map((s) => `${words(s.documentType)}${s.count > 1 ? ` × ${s.count}` : ''}`)
                      .join(', ')}
              </Text>
              {d.outsideReviews.length ? (
                <Text variant="caption" color="mutedForeground">
                  Independent reviews:{' '}
                  {d.outsideReviews
                    .map(
                      (r) =>
                        `${words(r.role)}${r.completedAt ? ` (${formatDate(r.completedAt, 'short')})` : ''}`
                    )
                    .join(', ')}
                  .
                </Text>
              ) : null}
            </Section>
            <Text variant="caption" color="mutedForeground">
              {d.disclaimer} Generated {formatDate(d.generatedAt, 'short')}.
            </Text>
          </ScrollView>
        ) : null}
      </QueryState>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <Card elevated style={{ gap: spacing.md }}>
      <Text variant="heading">{title}</Text>
      {children}
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text variant="callout" color="mutedForeground">
        {label}
      </Text>
      <Text variant="callout" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

function TheLand({ d }: { d: LandDossier }) {
  const { subject: s, parcel: p } = d;
  return (
    <Section title="The land">
      <Fact
        label="Title"
        value={
          p.titleType
            ? (LAND_TITLE_TYPE_LABEL[p.titleType as LandTitleType] ?? words(p.titleType))
            : 'Not stated'
        }
      />
      <Fact
        label="Area"
        value={`${(s.plot?.areaValue ?? p.areaValue).toLocaleString('en-NG')} ${words(s.plot?.areaUnit ?? p.areaUnit)}`}
      />
      {s.plot ? (
        <Fact
          label="Plot"
          value={`${s.plot.block ? `Block ${s.plot.block}, ` : ''}plot ${s.plot.plotNumber}`}
        />
      ) : null}
      <Fact label="Road access" value={p.roadAccess ? 'Yes' : 'Not stated'} />
      <Fact label="Encumbrances" value={words(p.encumbranceStatus)} />
      {p.boundarySignOff ? (
        <Fact
          label="Boundary"
          value={`${boundarySignOffText(p.boundarySignOff)}${
            p.boundarySignOff.status === 'SIGNED_OFF' && p.boundarySignOff.at
              ? ` (${formatDate(p.boundarySignOff.at, 'short')})`
              : ''
          }`}
        />
      ) : null}
      {d.riskBand ? (
        <Fact label="Risk" value={`${words(d.riskBand)} (${d.riskScore}/100)`} />
      ) : null}
    </Section>
  );
}

function AllInCost({ cost }: { cost: LandDossier['acquisitionCost'] }) {
  const { spacing } = useTheme();
  return (
    <Section title="All-in cost">
      {cost.items.map((item) => (
        <View key={`${item.key}-${item.status}`} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
            <Text variant="callout" style={{ flex: 1 }}>
              {item.label}
              {item.recurring ? ' · recurring' : ''}
            </Text>
            <Text variant="callout" style={{ fontWeight: '600' }}>
              {costFigure(item)}
            </Text>
          </View>
          <Badge label={COST_STATUS[item.status].label} tone={COST_STATUS[item.status].tone} />
          {item.basis ? (
            <Text variant="caption" color="mutedForeground">
              {item.basis}
            </Text>
          ) : null}
        </View>
      ))}
      <Divider />
      <Fact label="Confirmed so far" value={formatNaira(cost.confirmedTotal)} />
      <Fact label="With estimates" value={estimatedTotal(cost)} />
      {cost.unknownCount > 0 ? (
        <Text variant="caption" color="mutedForeground">
          Plus {cost.unknownCount} cost{cost.unknownCount === 1 ? '' : 's'} not yet known. Ask the
          seller and your lawyer for these before you commit.
        </Text>
      ) : null}
      {cost.estimatesDraft ? (
        <Text variant="caption" color="mutedForeground">
          Estimates are indicative and pending professional review.
        </Text>
      ) : null}
    </Section>
  );
}
