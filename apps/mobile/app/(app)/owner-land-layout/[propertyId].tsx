import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Circle, LayoutGrid, Plus, Search } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  ErrorState,
  FormAlert,
  ListSkeleton,
  NumberField,
  SegmentedControl,
  SwitchRow,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  EDITABLE_PLOT,
  LAYOUT_STATUS,
  landLayoutApi,
  layoutInput,
  layoutProblem,
  layoutToForm,
  parseTags,
  PLAN_FIELDS,
  planInput,
  planProblem,
  planToForm,
  PLOT_STATUS,
  PLOT_STATUSES,
  plotProblem,
  priceExample,
  publishChecklist,
  type Layout,
  type LayoutForm,
  type PaymentPlan,
  type PlanForm,
  type Plot,
  type PlotStatus,
} from '@/lib/api/landLayout';
import { formatBps, plotName } from '@/lib/api/landSales';
import {
  LAND_AREA_UNITS,
  ownerLandApi,
  type LandAreaUnit,
  type OwnerLandRecord,
} from '@/lib/api/ownerLand';
import { ApiError } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { LandDocumentChooser } from '@/components/land/LandDocumentChooser';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

type Tab = 'overview' | 'plots' | 'plans';
const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'plots', label: 'Plots' },
  { value: 'plans', label: 'Plans' },
];

/** Whether the master parcel itself could be sold: what a layout must clear to publish. */
const parcelSaleReady = (r: OwnerLandRecord | undefined, now: number) => {
  const d = r?.parcel?.diligence;
  return (
    r?.propertyVerificationStatus === 'APPROVED' &&
    d?.status === 'VERIFIED' &&
    (!d.expiresAt || Date.parse(d.expiresAt) > now)
  );
};

/** A developer's estate on one parcel: status, inventory, plots and payment plans. */
export default function OwnerLandLayout() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [editing, setEditing] = useState(false);
  // Captured once: render must not read the clock.
  const [now] = useState(() => Date.now());

  const land = useQuery({ queryKey: qk.owner.land, queryFn: () => ownerLandApi.list() });
  const record = land.data?.items.find((r) => r.propertyId === propertyId);
  const query = useQuery({
    queryKey: qk.owner.landLayout(propertyId),
    queryFn: () => landLayoutApi.get(propertyId),
    enabled: !!propertyId,
  });
  const layout = query.data;
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.owner.landLayout(propertyId) });
    qc.invalidateQueries({ queryKey: ['owner', 'land', 'estate', propertyId] });
    qc.invalidateQueries({ queryKey: qk.owner.landLayouts });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Land"
        title={layout?.name ?? 'Estate layout'}
        subtitle={record?.title}
        onBack={() => goBack()}
      />
      {query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <DetailSkeleton />
        </View>
      ) : query.isError ? (
        <ErrorState
          title="The estate layout could not be loaded"
          description={errorText(query.error, 'Nothing has changed.')}
          onRetry={() => query.refetch()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={refresh}
              tintColor={colors.mutedForeground}
            />
          }
        >
          {!layout ? (
            <Setup propertyId={propertyId} record={record} onCreated={refresh} />
          ) : (
            <>
              <StatusPanel
                layout={layout}
                saleReady={parcelSaleReady(record, now)}
                onEdit={() => setEditing(true)}
                onChanged={refresh}
              />
              <SegmentedControl
                options={TABS}
                value={tab}
                onChange={setTab}
                accessibilityLabel="Estate section"
              />
              {tab === 'overview' ? (
                <Overview propertyId={propertyId} layout={layout} />
              ) : tab === 'plots' ? (
                <Plots
                  propertyId={propertyId}
                  closed={layout.status === 'CLOSED'}
                  onChanged={refresh}
                />
              ) : (
                <Plans propertyId={propertyId} layout={layout} onChanged={refresh} />
              )}
            </>
          )}
        </ScrollView>
      )}

      <Sheet
        open={editing && !!layout}
        onClose={() => setEditing(false)}
        title="Edit estate details"
      >
        {layout ? (
          <LayoutFormView
            key={layout.id}
            propertyId={propertyId}
            layout={layout}
            onSaved={() => {
              setEditing(false);
              refresh();
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function Setup({
  propertyId,
  record,
  onCreated,
}: {
  propertyId: string;
  record: OwnerLandRecord | undefined;
  onCreated: () => void;
}) {
  const { colors, spacing } = useTheme();
  const blocker = !record?.parcel
    ? 'Add the master parcel details before creating a layout.'
    : !record.parcel.subdivisionAllowed
      ? 'This parcel is not marked as allowing subdivision. Turn on "Can subdivide" in the parcel details if the title permits it.'
      : null;
  return (
    <Card style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <LayoutGrid size={18} color={colors.primary} />
        <Text variant="heading">Sell this land as plots</Text>
      </View>
      <Text variant="callout" color="mutedForeground">
        Set up an estate layout to sell plots carved from this parcel, on outright or installment
        plans. GetRentos holds buyers’ payments and pays you as each conveyance step is confirmed.
      </Text>
      {blocker ? (
        <>
          <FormAlert tone="warning" message={blocker} />
          <Button
            label="Open parcel details"
            variant="secondary"
            onPress={() => router.push(`/(app)/owner-land-parcel/${propertyId}`)}
          />
        </>
      ) : (
        <LayoutFormView propertyId={propertyId} layout={null} onSaved={onCreated} />
      )}
    </Card>
  );
}

function LayoutFormView({
  propertyId,
  layout,
  onSaved,
}: {
  propertyId: string;
  layout: Layout | null;
  onSaved: () => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [f, setF] = useState<LayoutForm>(() => layoutToForm(layout));
  const set = (k: keyof LayoutForm) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const problem = layoutProblem(f);
  const feeTotal =
    (Number(f.documentationFee) || 0) +
    (Number(f.surveyFee) || 0) +
    (Number(f.developmentLevy) || 0);
  const save = useMutation({
    mutationFn: () =>
      layout
        ? landLayoutApi.update(propertyId, layoutInput(f, true))
        : landLayoutApi.create(propertyId, layoutInput(f, false)),
    onSuccess: () => {
      toast.show(
        layout
          ? 'Estate details saved.'
          : 'Estate layout created. Add plots and a payment plan next.',
        'success'
      );
      onSaved();
    },
    onError: (e) => toast.show(errorText(e, 'Could not save the estate.'), 'error'),
  });
  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label="Estate name"
        value={f.name}
        onChangeText={set('name')}
        maxLength={200}
        required
      />
      <TextField
        label="Description (optional)"
        hint="Shown to buyers."
        value={f.description}
        onChangeText={set('description')}
        multiline
      />
      <TextField
        label="Layout approval reference (optional)"
        hint="State planning permit or layout approval number."
        value={f.layoutApprovalReference}
        onChangeText={set('layoutApprovalReference')}
      />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <NumberField
            label="Reservation hold (hours)"
            value={f.reservationHoldHours}
            onValueChange={set('reservationHoldHours')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <NumberField
            label="Inspection hold (days)"
            value={f.inspectionHoldDays}
            onValueChange={set('inspectionHoldDays')}
          />
        </View>
      </View>
      <Text variant="caption" color="mutedForeground">
        A reservation holds a plot for this many hours. A buyer with an independent inspection under
        way can hold it until two days after their report, up to the inspection hold; 0 turns that
        off.
      </Text>
      <LandDocumentChooser
        propertyId={propertyId}
        label="Approved layout plan (optional)"
        value={f.layoutPlanDocumentId}
        onChange={(id) => set('layoutPlanDocumentId')(id === f.layoutPlanDocumentId ? '' : id)}
        uploadType="LAYOUT_PLAN"
        hint="Shown to compliance and buyers as evidence."
      />
      <Text variant="bodyStrong">Fees added to every plot</Text>
      <NumberField
        currency
        label="Documentation"
        value={f.documentationFee}
        onValueChange={set('documentationFee')}
      />
      <NumberField currency label="Survey" value={f.surveyFee} onValueChange={set('surveyFee')} />
      <NumberField
        currency
        label="Development levy"
        value={f.developmentLevy}
        onValueChange={set('developmentLevy')}
      />
      <Text variant="caption" color="mutedForeground">
        {formatNaira(feeTotal)} in fees on each plot.
      </Text>
      {problem && f.name ? (
        <Text variant="caption" color="mutedForeground">
          {problem}
        </Text>
      ) : null}
      <Button
        label={layout ? 'Save changes' : 'Create layout'}
        loading={save.isPending}
        disabled={!!problem || save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

function StatusPanel({
  layout,
  saleReady,
  onEdit,
  onChanged,
}: {
  layout: Layout;
  saleReady: boolean;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [publishError, setPublishError] = useState<string | null>(null);
  const status = LAYOUT_STATUS[layout.status];
  const checklist = publishChecklist({
    parcelSaleReady: saleReady,
    available: layout.plotCounts.AVAILABLE ?? 0,
    activePlans: layout.paymentPlans.filter((p) => p.active).length,
  });

  const publish = useMutation({
    mutationFn: () => landLayoutApi.publish(layout.propertyId),
    onSuccess: () => {
      setPublishError(null);
      onChanged();
      toast.show('Your estate is on sale. Buyers can now reserve available plots.', 'success');
    },
    // Kept on screen, not only toasted: it is usually something to fix first.
    onError: (e) => setPublishError(errorText(e, 'The estate could not be published.')),
  });
  const close = useMutation({
    mutationFn: () => landLayoutApi.close(layout.propertyId),
    onSuccess: () => {
      onChanged();
      toast.show('Sales closed. Live contracts carry on as agreed.', 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not close sales.'), 'error'),
  });

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="heading" style={{ flex: 1 }} numberOfLines={2}>
          {layout.name}
        </Text>
        <Badge label={status.label} tone={status.tone} />
      </View>
      <Text variant="callout" color="mutedForeground">
        {layout.status === 'PUBLISHED' && layout.publishedAt
          ? `On sale since ${formatDate(layout.publishedAt)}.`
          : layout.status === 'CLOSED' && layout.closedAt
            ? `Closed to new reservations on ${formatDate(layout.closedAt)}. Live contracts continue.`
            : 'Not yet visible to buyers.'}
      </Text>
      {layout.status !== 'PUBLISHED'
        ? checklist.map((item) => {
            const Icon = item.done ? CheckCircle2 : Circle;
            return (
              <View key={item.label} style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Icon
                  size={16}
                  color={item.done ? colors.success : colors.mutedForeground}
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="callout" style={{ fontWeight: '600' }}>
                    {item.label}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    {item.detail}
                  </Text>
                </View>
              </View>
            );
          })
        : null}
      {publishError ? (
        <FormAlert
          tone="warning"
          title="The estate could not be published."
          message={publishError}
        />
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {layout.status === 'PUBLISHED' ? (
          <Button
            label="Close sales"
            size="sm"
            variant="destructive"
            loading={close.isPending}
            onPress={() =>
              Alert.alert(
                'Close sales on this estate?',
                'Buyers will not be able to reserve plots any more. Existing reservations run out on their own and live contracts continue on their agreed terms. You can reopen sales later.',
                [
                  { text: 'Keep selling', style: 'cancel' },
                  { text: 'Close sales', style: 'destructive', onPress: () => close.mutate() },
                ]
              )
            }
          />
        ) : (
          <Button
            label={layout.status === 'CLOSED' ? 'Reopen sales' : 'Publish estate'}
            size="sm"
            loading={publish.isPending}
            disabled={publish.isPending}
            onPress={() => publish.mutate()}
          />
        )}
        <Button
          label="Edit details"
          size="sm"
          variant="secondary"
          disabled={layout.status === 'CLOSED'}
          onPress={onEdit}
        />
      </View>
    </Card>
  );
}

function Overview({ propertyId, layout }: { propertyId: string; layout: Layout }) {
  const { colors, spacing, radius } = useTheme();
  const dash = useQuery({
    queryKey: ['owner', 'land', 'estate', propertyId, 'dashboard'],
    queryFn: () => landLayoutApi.dashboard(propertyId),
  });
  const d = dash.data;
  const barColor: Record<PlotStatus, string> = {
    AVAILABLE: colors.success,
    RESERVED: colors.info,
    UNDER_INSTALLMENT: colors.warning,
    SOLD: colors.mutedForeground,
    ALLOCATED: colors.foreground,
    WITHHELD: colors.destructive,
  };
  return (
    <View style={{ gap: spacing.lg }}>
      {dash.isLoading ? (
        <ListSkeleton rows={2} variant="card" height={90} />
      ) : d ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Tile
              label="Plots"
              value={d.totalPlots.toLocaleString('en-NG')}
              note={`${d.counts.AVAILABLE ?? 0} available`}
            />
            <Tile label="Sell-through" value={`${Number(d.sellThroughPercent.toFixed(1))}%`} />
            <Tile
              label="Inventory value"
              value={formatNaira(d.totalValue)}
              note={`${formatNaira(d.availableValue)} still available`}
            />
            <Tile label="Value sold" value={formatNaira(d.soldValue)} />
          </View>
          {d.totalPlots > 0 ? (
            <Card style={{ gap: spacing.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  height: 8,
                  borderRadius: radius.full,
                  overflow: 'hidden',
                  backgroundColor: colors.secondary,
                }}
              >
                {PLOT_STATUSES.map((s) => (
                  <View
                    key={s}
                    style={{
                      width: `${((d.counts[s] ?? 0) / d.totalPlots) * 100}%`,
                      backgroundColor: barColor[s],
                    }}
                  />
                ))}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                {PLOT_STATUSES.map((s) => (
                  <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View
                      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: barColor[s] }}
                    />
                    <Text variant="caption" color="mutedForeground">
                      {PLOT_STATUS[s].label} {d.counts[s] ?? 0}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}
          <Card style={{ gap: spacing.sm }}>
            <Text variant="bodyStrong">
              {d.purchases.live} live contract{d.purchases.live === 1 ? '' : 's'}
              {d.purchases.defaulted > 0 ? `, ${d.purchases.defaulted} defaulted` : ''}
            </Text>
            <Text variant="callout" color="mutedForeground">
              Collected {formatNaira(d.purchases.collected)} · outstanding{' '}
              {formatNaira(d.purchases.outstanding)}
            </Text>
            <Text
              variant="callout"
              style={{
                color: d.purchases.overdueAmount > 0 ? colors.destructive : colors.mutedForeground,
              }}
            >
              Overdue {formatNaira(d.purchases.overdueAmount)}
            </Text>
            <Button
              label="Open plot sales"
              size="sm"
              variant="secondary"
              onPress={() => router.push(`/(app)/owner-land-sales?property=${propertyId}`)}
              style={{ alignSelf: 'flex-start' }}
            />
          </Card>
        </>
      ) : null}
      <Card style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Estate details</Text>
        {layout.description ? (
          <Text variant="callout" color="mutedForeground">
            {layout.description}
          </Text>
        ) : null}
        <Text variant="caption" color="mutedForeground">
          Layout approval: {layout.layoutApprovalReference ?? 'Not recorded'} · layout plan{' '}
          {layout.layoutPlanDocumentId ? 'attached' : 'not attached'}
        </Text>
        <Text variant="caption" color="mutedForeground">
          Reservation hold {layout.reservationHoldHours} hours · inspection hold{' '}
          {layout.inspectionHoldDays} days
        </Text>
        <Text variant="caption" color="mutedForeground">
          Fees per plot: documentation {formatNaira(layout.fees.documentationFee)}, survey{' '}
          {formatNaira(layout.fees.surveyFee)}, development levy{' '}
          {formatNaira(layout.fees.developmentLevy)}
        </Text>
      </Card>
    </View>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  const { spacing } = useTheme();
  return (
    <Card padding={spacing.md} style={{ flexBasis: '47%', flexGrow: 1, gap: 2 }}>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
      {note ? (
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {note}
        </Text>
      ) : null}
    </Card>
  );
}

const ALL = 'all';

function Plots({
  propertyId,
  closed,
  onChanged,
}: {
  propertyId: string;
  closed: boolean;
  onChanged: () => void;
}) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [status, setStatus] = useState<PlotStatus | typeof ALL>(ALL);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Plot | 'new' | null>(null);
  const plots = useQuery({
    queryKey: ['owner', 'land', 'estate', propertyId, 'plots', status],
    queryFn: () => landLayoutApi.plots(propertyId, status === ALL ? undefined : status),
  });
  const term = search.trim().toLowerCase();
  const visible = (plots.data ?? []).filter(
    (p) =>
      !term || [p.plotNumber, p.block ?? '', ...p.tags].some((v) => v.toLowerCase().includes(term))
  );

  const move = useMutation({
    mutationFn: ({ plot, to }: { plot: Plot; to: 'withhold' | 'release' }) =>
      to === 'withhold'
        ? landLayoutApi.withholdPlot(propertyId, plot.id)
        : landLayoutApi.releasePlot(propertyId, plot.id),
    onSuccess: (plot, { to }) => {
      onChanged();
      toast.show(
        `${plotName(plot)} is ${to === 'withhold' ? 'off sale' : 'back on sale'}.`,
        'success'
      );
    },
    onError: (e) => toast.show(errorText(e, 'Could not change that plot.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <TextField
            placeholder="Plot, block or tag"
            value={search}
            onChangeText={setSearch}
            leftIcon={<Search size={16} color={colors.mutedForeground} />}
            accessibilityLabel="Search plots"
          />
        </View>
        {!closed ? (
          <Button
            label="Add"
            size="sm"
            icon={<Plus size={14} color={colors.primaryForeground} />}
            onPress={() => setEditing('new')}
          />
        ) : null}
      </View>
      <ChipSelect
        options={[
          { value: ALL, label: 'All' },
          ...PLOT_STATUSES.map((s) => ({ value: s, label: PLOT_STATUS[s].label })),
        ]}
        value={status}
        onChange={setStatus}
      />
      <Text variant="caption" color="mutedForeground">
        Adding many plots at once from a spreadsheet is on the web app.
      </Text>
      {plots.isLoading ? (
        <ListSkeleton rows={3} variant="card" height={90} />
      ) : visible.length === 0 ? (
        <Text variant="callout" color="mutedForeground">
          {term || status !== ALL ? 'No plots match.' : 'No plots yet. Add the first one.'}
        </Text>
      ) : (
        visible.map((p) => (
          <Card key={p.id} padding={spacing.lg} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {plotName(p)}
              </Text>
              <Badge label={PLOT_STATUS[p.status].label} tone={PLOT_STATUS[p.status].tone} />
            </View>
            <Text variant="caption" color="mutedForeground">
              {p.areaValue.toLocaleString('en-NG')}{' '}
              {LAND_AREA_UNITS.find((u) => u.value === p.areaUnit)?.label ?? ''} ·{' '}
              {formatNaira(p.price)}
              {p.pricePerSqm !== undefined ? ` (${formatNaira(p.pricePerSqm)}/sqm)` : ''}
            </Text>
            {p.isCorner || p.tags.length ? (
              <Text variant="caption" color="mutedForeground">
                {[p.isCorner ? 'Corner' : null, ...p.tags].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            {p.status === 'RESERVED' && p.heldUntil ? (
              <Text variant="caption" color="mutedForeground">
                Held until {formatDate(p.heldUntil, 'short')}
              </Text>
            ) : null}
            {EDITABLE_PLOT.has(p.status) && !closed ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                <Button label="Edit" size="sm" variant="secondary" onPress={() => setEditing(p)} />
                {p.status === 'AVAILABLE' ? (
                  <Button
                    label="Withhold"
                    size="sm"
                    variant="ghost"
                    onPress={() =>
                      Alert.alert(
                        `Withhold ${plotName(p)}?`,
                        'The plot comes off sale and buyers can no longer reserve it. You can release it back on sale at any time.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Withhold',
                            onPress: () => move.mutate({ plot: p, to: 'withhold' }),
                          },
                        ]
                      )
                    }
                  />
                ) : (
                  <Button
                    label="Release"
                    size="sm"
                    variant="ghost"
                    loading={move.isPending && move.variables?.plot.id === p.id}
                    onPress={() => move.mutate({ plot: p, to: 'release' })}
                  />
                )}
              </View>
            ) : null}
          </Card>
        ))
      )}
      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a plot' : editing ? `Edit ${plotName(editing)}` : ''}
      >
        {editing ? (
          <PlotFormView
            key={editing === 'new' ? 'new' : editing.id}
            propertyId={propertyId}
            plot={editing === 'new' ? null : editing}
            onSaved={() => {
              setEditing(null);
              onChanged();
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function PlotFormView({
  propertyId,
  plot,
  onSaved,
}: {
  propertyId: string;
  plot: Plot | null;
  onSaved: () => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [plotNumber, setPlotNumber] = useState(plot?.plotNumber ?? '');
  const [block, setBlock] = useState(plot?.block ?? '');
  const [areaValue, setAreaValue] = useState(plot ? String(plot.areaValue) : '');
  const [areaUnit, setAreaUnit] = useState<LandAreaUnit>(plot?.areaUnit ?? 'SQUARE_METERS');
  const [price, setPrice] = useState(plot ? String(plot.price) : '');
  const [isCorner, setIsCorner] = useState(plot?.isCorner ?? false);
  const [tags, setTags] = useState((plot?.tags ?? []).join(', '));
  const problem = plotProblem(!!plot, { plotNumber, areaValue, price, tags });

  const save = useMutation({
    mutationFn: () =>
      plot
        ? landLayoutApi.updatePlot(propertyId, plot.id, {
            price: Math.round(Number(price)),
            isCorner,
            tags: parseTags(tags),
          })
        : landLayoutApi.addPlot(propertyId, {
            plotNumber: plotNumber.trim(),
            ...(block.trim() ? { block: block.trim() } : {}),
            areaValue: Number(areaValue),
            areaUnit,
            price: Math.round(Number(price)),
            isCorner,
            tags: parseTags(tags),
          }),
    onSuccess: (saved) => {
      toast.show(`${plotName(saved)} ${plot ? 'updated' : 'added'}.`, 'success');
      onSaved();
    },
    onError: (e) => toast.show(errorText(e, 'Could not save the plot.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      {plot ? (
        <Text variant="caption" color="mutedForeground">
          The plot number, block and size are fixed once a plot exists.
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Plot number"
                value={plotNumber}
                onChangeText={setPlotNumber}
                required
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Block (optional)" value={block} onChangeText={setBlock} />
            </View>
          </View>
          <NumberField label="Size" value={areaValue} onValueChange={setAreaValue} />
          <ChipSelect
            label="Unit"
            options={LAND_AREA_UNITS}
            value={areaUnit}
            onChange={setAreaUnit}
          />
        </>
      )}
      <NumberField currency label="Asking price" value={price} onValueChange={setPrice} />
      <SwitchRow label="Corner plot" value={isCorner} onValueChange={setIsCorner} />
      <TextField
        label="Tags (optional)"
        hint="Comma separated, e.g. road-facing, close to gate."
        value={tags}
        onChangeText={setTags}
      />
      {problem && (price || plotNumber) ? (
        <Text variant="caption" color="mutedForeground">
          {problem}
        </Text>
      ) : null}
      <Button
        label={plot ? 'Save plot' : 'Add plot'}
        loading={save.isPending}
        disabled={!!problem || save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

function Plans({
  propertyId,
  layout,
  onChanged,
}: {
  propertyId: string;
  layout: Layout;
  onChanged: () => void;
}) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [editing, setEditing] = useState<PaymentPlan | 'new' | null>(null);
  const available = useQuery({
    queryKey: ['owner', 'land', 'estate', propertyId, 'plots', 'AVAILABLE'],
    queryFn: () => landLayoutApi.plots(propertyId, 'AVAILABLE'),
  });
  const samplePrice = available.data?.length ? Math.min(...available.data.map((p) => p.price)) : 0;
  const plans = [...layout.paymentPlans].sort((a, b) => Number(b.active) - Number(a.active));

  const toggle = useMutation({
    mutationFn: ({ plan, active }: { plan: PaymentPlan; active: boolean }) =>
      landLayoutApi.updatePlan(propertyId, plan.id, { active }),
    onSuccess: (plan) => {
      onChanged();
      toast.show(
        plan.active ? `${plan.name} is offered again.` : `${plan.name} is no longer offered.`,
        'success'
      );
    },
    onError: (e) => toast.show(errorText(e, 'Could not change the plan.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
          How buyers can pay. Terms are fixed on each purchase when it starts.
        </Text>
        <Button
          label="New plan"
          size="sm"
          icon={<Plus size={14} color={colors.primaryForeground} />}
          onPress={() => setEditing('new')}
        />
      </View>
      {plans.length === 0 ? (
        <Text variant="callout" color="mutedForeground">
          No payment plans yet. A published estate needs at least one.
        </Text>
      ) : (
        plans.map((plan) => {
          const ex = samplePrice > 0 ? priceExample(samplePrice, layout.fees.total, plan) : null;
          return (
            <Card
              key={plan.id}
              padding={spacing.lg}
              style={{ gap: spacing.sm, opacity: plan.active ? 1 : 0.7 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {plan.name}
                </Text>
                <Badge
                  label={plan.active ? 'Offered' : 'Retired'}
                  tone={plan.active ? 'success' : 'neutral'}
                />
              </View>
              <Text variant="callout" color="mutedForeground">
                {plan.durationMonths === 0
                  ? 'Outright'
                  : `${plan.durationMonths} months, ${formatBps(plan.initialDepositBps)} deposit`}
              </Text>
              <Text variant="caption" color="mutedForeground">
                Premium {formatBps(plan.priceUpliftBps)} · grace {plan.gracePeriodDays} days · late
                fee {formatBps(plan.lateFeeBps)} · default after {plan.defaultAfterDays} days ·
                forfeiture {formatBps(plan.revocationChargeBps)}
              </Text>
              {ex ? (
                <Text variant="caption" color="mutedForeground">
                  On the cheapest available plot ({formatNaira(samplePrice)}):{' '}
                  {ex.months === 0
                    ? `${formatNaira(ex.totalPrice)} in one payment`
                    : `${formatNaira(ex.initialPayment)} to start, then ${formatNaira(ex.monthlyInstallment)} a month (${formatNaira(ex.totalPrice)} in all)`}
                  .
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button
                  label="Edit"
                  size="sm"
                  variant="secondary"
                  onPress={() => setEditing(plan)}
                />
                {plan.active ? (
                  <Button
                    label="Retire"
                    size="sm"
                    variant="ghost"
                    onPress={() =>
                      Alert.alert(
                        `Retire ${plan.name}?`,
                        'New buyers will not be able to choose this plan. Purchases already on it continue on their agreed terms. A published estate must keep at least one plan on offer.',
                        [
                          { text: 'Keep it', style: 'cancel' },
                          { text: 'Retire', onPress: () => toggle.mutate({ plan, active: false }) },
                        ]
                      )
                    }
                  />
                ) : (
                  <Button
                    label="Offer again"
                    size="sm"
                    variant="ghost"
                    loading={toggle.isPending && toggle.variables?.plan.id === plan.id}
                    onPress={() => toggle.mutate({ plan, active: true })}
                  />
                )}
              </View>
            </Card>
          );
        })
      )}
      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New payment plan' : 'Edit payment plan'}
      >
        {editing ? (
          <PlanFormView
            key={editing === 'new' ? 'new' : editing.id}
            propertyId={propertyId}
            plan={editing === 'new' ? null : editing}
            fees={layout.fees.total}
            samplePrice={samplePrice || 10_000_000}
            onSaved={() => {
              setEditing(null);
              onChanged();
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function PlanFormView({
  propertyId,
  plan,
  fees,
  samplePrice,
  onSaved,
}: {
  propertyId: string;
  plan: PaymentPlan | null;
  fees: number;
  samplePrice: number;
  onSaved: () => void;
}) {
  const { spacing, radius, colors } = useTheme();
  const toast = useToast();
  const [f, setF] = useState<PlanForm>(() => planToForm(plan));
  const set = (k: keyof PlanForm) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const problem = planProblem(f);
  const ex = problem ? null : priceExample(samplePrice, fees, planInput(f));

  const save = useMutation({
    mutationFn: () =>
      plan
        ? landLayoutApi.updatePlan(propertyId, plan.id, planInput(f))
        : landLayoutApi.createPlan(propertyId, planInput(f)),
    onSuccess: (saved) => {
      toast.show(
        plan ? `${saved.name} saved.` : `${saved.name} is now offered to buyers.`,
        'success'
      );
      onSaved();
    },
    onError: (e) => toast.show(errorText(e, 'Could not save the plan.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label="Plan name"
        value={f.name}
        onChangeText={set('name')}
        maxLength={120}
        required
      />
      {PLAN_FIELDS.map((field) => (
        <NumberField
          key={field.key}
          label={field.label}
          hint={field.hint}
          value={f[field.key]}
          onValueChange={set(field.key)}
        />
      ))}
      {ex ? (
        <View
          style={{
            backgroundColor: colors.secondary,
            borderRadius: radius.md,
            padding: spacing.md,
            gap: 2,
          }}
        >
          <Text variant="callout" style={{ fontWeight: '600' }}>
            For a {formatNaira(samplePrice)} plot
          </Text>
          <Text variant="caption" color="mutedForeground">
            {ex.months === 0
              ? `${formatNaira(ex.totalPrice)} in one payment, fees included.`
              : `${formatNaira(ex.initialPayment)} to start, then ${formatNaira(ex.monthlyInstallment)} a month for ${ex.months} months${ex.finalInstallment !== ex.monthlyInstallment ? ` (last one ${formatNaira(ex.finalInstallment)})` : ''}. ${formatNaira(ex.totalPrice)} in all, with ${formatNaira(ex.priceUplift)} premium and ${formatNaira(fees)} fees.`}
          </Text>
        </View>
      ) : null}
      {problem && f.name ? (
        <Text variant="caption" color="mutedForeground">
          {problem}
        </Text>
      ) : null}
      <Button
        label={plan ? 'Save plan' : 'Create plan'}
        loading={save.isPending}
        disabled={!!problem || save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
