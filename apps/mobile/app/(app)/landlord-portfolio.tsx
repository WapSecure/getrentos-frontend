import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpRight, Building2, Sparkles, TrendingUp } from 'lucide-react-native';
import {
  Button,
  Card,
  FormAlert,
  ListSkeleton,
  NumberField,
  Price,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordFinanceApi,
  optionalAmount,
  percent,
  PORTFOLIO_SORTS,
  sortPerformance,
  type PortfolioAnalytics,
  type PortfolioSort,
  type PropertyPerformance,
} from '@/lib/api/landlordFinance';
import { errorMessage } from '@/lib/api/client';
import { planRefusal, retryUnlessPlanGate } from '@/lib/api/estateGate';
import { formatNaira } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { ProUpsell } from '@/components/estate/governance/ProUpsell';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const DEFINITIONS: [string, string][] = [
  ['Net income', 'Rent you collected minus what you spent on the property.'],
  ['Cap rate', 'Net income for the year divided by what the property is worth today.'],
  ['Yield on cost', 'Net income for the year divided by what you paid for it.'],
  ['Appreciation', 'How much the property is worth now compared with what you paid.'],
];

export default function LandlordPortfolio() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<PortfolioSort>('netOperatingIncome');
  const [editing, setEditing] = useState<PropertyPerformance | null>(null);

  const query = useQuery({
    queryKey: qk.landlord.portfolio,
    queryFn: landlordFinanceApi.portfolio,
    retry: retryUnlessPlanGate,
  });
  const locked = !!planRefusal(query.error);
  const data = query.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Financials"
        title="Portfolio"
        subtitle={`How each property earns, over the last ${data?.summary.windowMonths ?? 12} months`}
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        refreshControl={
          locked ? undefined : (
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              tintColor={colors.mutedForeground}
            />
          )
        }
      >
        {locked ? (
          <ProUpsell
            title="Portfolio analytics are part of Pro"
            description="Compare your properties by what they actually earn."
            perks={[
              'Net income, cap rate, yield and occupancy for every property',
              'Which property leads and which lags the rest',
              'A plain-language briefing with what to do next',
            ]}
            note={null}
          />
        ) : (
          <QueryState
            query={query}
            skeleton={<ListSkeleton rows={4} variant="card" height={110} />}
            errorTitle="Portfolio figures are unavailable"
            errorDescription="We could not load how your properties are performing. Nothing has changed."
            isEmpty={(data?.properties ?? []).length === 0}
            empty={{
              icon: <Building2 size={32} color={colors.mutedForeground} />,
              title: 'No properties to compare yet',
              description: 'Add a property and let a unit, and its performance will show up here.',
            }}
          >
            {data ? (
              <>
                <Briefing />
                <Summary data={data} />
                <Unvalued data={data} />
                <ChipSelect
                  label="Sort by"
                  options={PORTFOLIO_SORTS}
                  value={sort}
                  onChange={setSort}
                />
                {sortPerformance(data.properties, sort).map((p) => (
                  <PropertyCard
                    key={p.propertyId}
                    row={p}
                    standing={
                      p.propertyId === data.summary.bestCapRatePropertyId
                        ? 'Highest cap rate'
                        : p.propertyId === data.summary.weakestCapRatePropertyId
                          ? 'Lowest cap rate'
                          : null
                    }
                    onAddFigures={() => setEditing(p)}
                  />
                ))}
                <View style={{ gap: spacing.xs }}>
                  {DEFINITIONS.map(([term, meaning]) => (
                    <Text key={term} variant="caption" color="mutedForeground">
                      <Text variant="caption" style={{ fontWeight: '600' }}>
                        {term}:{' '}
                      </Text>
                      {meaning}
                    </Text>
                  ))}
                </View>
              </>
            ) : null}
          </QueryState>
        )}
      </ScrollView>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Property value">
        {editing ? (
          <ValueForm key={editing.propertyId} row={editing} onDone={() => setEditing(null)} />
        ) : null}
      </Sheet>
    </View>
  );
}

function Summary({ data }: { data: PortfolioAnalytics }) {
  const { spacing } = useTheme();
  const s = data.summary;
  const tiles = [
    {
      label: 'Net income',
      value: formatNaira(s.netOperatingIncome),
      hint: `${formatNaira(s.rentCollected)} collected, ${formatNaira(s.operatingExpenses)} spent`,
    },
    {
      label: 'Cap rate',
      value: percent(s.capRate),
      hint:
        s.capRate === null
          ? 'Add property values to see this'
          : `${s.valuedPropertyCount} of ${s.propertyCount} properties valued`,
    },
    {
      label: 'Yield on cost',
      value: percent(s.yieldOnCost),
      hint: s.yieldOnCost === null ? 'Add purchase prices to see this' : 'On what you paid',
    },
    {
      label: 'Occupancy',
      value: percent(s.occupancyRate),
      hint: `${s.occupiedUnits} of ${s.totalUnits} units let`,
    },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {tiles.map((t) => (
        <Card key={t.label} padding={spacing.lg} style={{ flexBasis: '47%', flexGrow: 1, gap: 2 }}>
          <Text variant="caption" color="mutedForeground">
            {t.label}
          </Text>
          <Text variant="heading">{t.value}</Text>
          <Text variant="caption" color="mutedForeground">
            {t.hint}
          </Text>
        </Card>
      ))}
    </View>
  );
}

function Unvalued({ data }: { data: PortfolioAnalytics }) {
  const n = data.properties.filter((p) => p.missing.includes('estimatedValue')).length;
  if (n === 0) return null;
  return (
    <FormAlert
      tone="warning"
      message={`${n === 1 ? '1 property has' : `${n} properties have`} no current value, so ${
        n === 1 ? 'it is' : 'they are'
      } left out of the cap rate. Add a value on the property below.`}
    />
  );
}

/** Fetches on its own and hides on error, so it never blocks the figures. */
function Briefing() {
  const { colors, spacing } = useTheme();
  const q = useQuery({
    queryKey: qk.landlord.portfolioBriefing,
    queryFn: landlordFinanceApi.briefing,
    staleTime: 5 * 60_000,
    retry: false,
  });
  if (q.isLoading) return <ListSkeleton rows={1} variant="card" height={120} />;
  const b = q.data;
  if (q.isError || !b || b.hasData === false) return null;
  const insights = Array.isArray(b.insights) ? b.insights : [];
  const actions = Array.isArray(b.actions) ? b.actions : [];
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Sparkles size={16} color={colors.primary} />
        <Text variant="bodyStrong">Portfolio briefing</Text>
      </View>
      <Text variant="callout">{b.headline}</Text>
      {[
        { title: 'What the numbers say', items: insights, Icon: TrendingUp },
        { title: 'Recommended next steps', items: actions, Icon: ArrowUpRight },
      ].map(({ title, items, Icon }) =>
        items.length ? (
          <View key={title} style={{ gap: spacing.sm }}>
            <Text variant="caption" color="mutedForeground" style={{ fontWeight: '600' }}>
              {title.toUpperCase()}
            </Text>
            {items.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Icon size={14} color={colors.primary} style={{ marginTop: 3 }} />
                <Text variant="callout" style={{ flex: 1 }}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
        ) : null
      )}
    </Card>
  );
}

function PropertyCard({
  row: p,
  standing,
  onAddFigures,
}: {
  row: PropertyPerformance;
  standing: string | null;
  onAddFigures: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Card padding={spacing.lg} style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {p.name}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {p.city}
          {standing ? ` · ${standing}` : ''}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
        <Price
          amount={p.netOperatingIncome}
          variant="heading"
          color={p.netOperatingIncome < 0 ? 'destructive' : 'foreground'}
        />
        <Text variant="caption" color="mutedForeground">
          net income
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <Stat label="Collected" value={formatNaira(p.rentCollected)} />
        <Stat label="Spent" value={formatNaira(p.operatingExpenses)} />
        <Stat
          label="Occupancy"
          value={`${percent(p.occupancyRate)} (${p.occupiedUnits}/${p.totalUnits})`}
        />
        <Stat
          label="Cap rate"
          value={percent(p.capRate)}
          tone={
            p.capRateVsPortfolio === null
              ? undefined
              : p.capRateVsPortfolio < 0
                ? colors.destructive
                : colors.success
          }
        />
        <Stat label="Yield on cost" value={percent(p.yieldOnCost)} />
        <Stat label="Appreciation" value={percent(p.appreciation)} />
      </View>
      {p.capRateVsPortfolio !== null ? (
        <Text variant="caption" color="mutedForeground">
          Cap rate {p.capRateVsPortfolio > 0 ? '+' : ''}
          {p.capRateVsPortfolio.toFixed(1)} pts against the portfolio
        </Text>
      ) : null}
      {p.missing.length > 0 ? (
        <Button
          label={
            p.missing.length === 2
              ? 'Add value and price'
              : p.missing[0] === 'estimatedValue'
                ? 'Add current value'
                : 'Add purchase price'
          }
          size="sm"
          variant="secondary"
          onPress={onAddFigures}
        />
      ) : null}
    </Card>
  );
}

function ValueForm({ row, onDone }: { row: PropertyPerformance; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [value, setValue] = useState(row.estimatedValue ? String(row.estimatedValue) : '');
  const [price, setPrice] = useState(row.purchasePrice ? String(row.purchasePrice) : '');
  const estimatedValue = optionalAmount(value);
  const purchasePrice = optionalAmount(price);
  const invalid = estimatedValue === null || purchasePrice === null;
  const empty = estimatedValue === undefined && purchasePrice === undefined;

  const save = useMutation({
    mutationFn: () =>
      landlordFinanceApi.setValues(row.propertyId, {
        ...(estimatedValue ? { estimatedValue } : {}),
        ...(purchasePrice ? { purchasePrice } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.landlord.portfolio });
      qc.invalidateQueries({ queryKey: qk.landlord.portfolioBriefing });
      toast.show('Figures saved.', 'success');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not save these figures.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        {row.name}. Saved on the property, and used for the figures on this screen.
      </Text>
      <NumberField
        currency
        label="What it is worth today"
        value={value}
        onValueChange={setValue}
        hint="Unlocks the cap rate and appreciation."
      />
      <NumberField
        currency
        label="What you paid for it"
        value={price}
        onValueChange={setPrice}
        hint="Unlocks yield on cost and appreciation."
      />
      <Button
        label="Save"
        loading={save.isPending}
        disabled={invalid || empty || save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexBasis: '30%', flexGrow: 1, gap: 2 }}>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      <Text variant="callout" style={{ fontWeight: '600', color: tone ?? colors.foreground }}>
        {value}
      </Text>
    </View>
  );
}
