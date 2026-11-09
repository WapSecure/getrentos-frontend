import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DetailSkeleton,
  FormAlert,
  PressableScale,
  QueryState,
  SwitchRow,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  filterPlots,
  landBuyerApi,
  PLOT_FILTERS,
  PLOT_STATUS_COLOR,
  PLOT_STATUS_LABEL,
  plotLabel,
  type EstateDetail,
  type EstatePlot,
  type PlotFilter,
  type Reservation,
} from '@/lib/api/landBuyer';
import { accountRolesApi } from '@/lib/api/accountRoles';
import { errorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { formatDate, formatDateTime, formatNaira } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { PlanCard, StartPurchase } from '@/components/land/StartPurchase';
import { RequestInspection, RequestTour } from '@/components/land/LandRequests';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const ALL = '';

export default function LandEstate() {
  const { id, plot } = useLocalSearchParams<{ id: string; plot?: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(plot ?? null);
  const [status, setStatus] = useState<PlotFilter>('available');
  const [block, setBlock] = useState(ALL);
  const [cornerOnly, setCornerOnly] = useState(false);
  const [starting, setStarting] = useState<Reservation | null>(null);
  const [request, setRequest] = useState<'tour' | 'inspection' | null>(null);
  const q = useQuery({
    queryKey: qk.buyerLand.estate(id),
    queryFn: () => landBuyerApi.estate(id),
    enabled: !!id,
  });
  const e = q.data;
  const selected = e?.plots.find((p) => p.id === selectedId) ?? null;
  const blocks = [...new Set((e?.plots ?? []).map((p) => p.block ?? '').filter(Boolean))].sort();
  const plots = e ? filterPlots(e.plots, { status, block: block || undefined, cornerOnly }) : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Estate"
        title={e?.name ?? 'Estate'}
        subtitle={e ? `${e.city}, ${e.state}` : undefined}
        onBack={() => goBack()}
      />
      <QueryState
        query={q}
        skeleton={<DetailSkeleton />}
        errorTitle="This estate is not available"
        errorDescription="It may have closed or its land is no longer verified."
        style={{ paddingHorizontal: spacing.xl }}
      >
        {e ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            refreshControl={
              <RefreshControl
                refreshing={q.isRefetching}
                onRefresh={() => q.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            <Summary e={e} />
            {(e.openConditions ?? []).length ? (
              <FormAlert
                tone="warning"
                title="Verified with conditions"
                message={`Plot reservations open once they are met.\n${e
                  .openConditions!.map(
                    (c) => `• ${c.text}${c.dueAt ? ` (expected by ${formatDate(c.dueAt)})` : ''}`
                  )
                  .join('\n')}`}
              />
            ) : null}

            <View style={{ gap: spacing.md }}>
              <Text variant="heading">Plots</Text>
              <ChipSelect options={PLOT_FILTERS} value={status} onChange={setStatus} />
              {blocks.length > 1 ? (
                <ChipSelect
                  options={[
                    { value: ALL, label: 'All blocks' },
                    ...blocks.map((b) => ({ value: b, label: `Block ${b}` })),
                  ]}
                  value={block}
                  onChange={setBlock}
                />
              ) : null}
              <SwitchRow
                label="Corner plots only"
                value={cornerOnly}
                onValueChange={setCornerOnly}
              />
              <Text variant="caption" color="mutedForeground">
                {plots.length} of {e.plots.length} plots
              </Text>
              {plots.length === 0 ? (
                <Text variant="callout" color="mutedForeground">
                  No plots match these filters.
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {plots.map((p) => (
                    <PlotCell
                      key={p.id}
                      plot={p}
                      selected={p.id === selectedId}
                      onPress={() => setSelectedId(p.id)}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={{ gap: spacing.md }}>
              <Text variant="heading">Payment plans</Text>
              <Text variant="caption" color="mutedForeground">
                {selected
                  ? `Priced for ${plotLabel(selected)}.`
                  : 'An example price; choose a plot to see its own.'}
              </Text>
              {e.paymentPlans.filter((p) => p.active).length === 0 ? (
                <Text variant="callout" color="mutedForeground">
                  No payment plan is open on this estate.
                </Text>
              ) : (
                e.paymentPlans
                  .filter((p) => p.active)
                  .map((p) => (
                    <PlanCard
                      key={p.id}
                      plan={p}
                      plotPrice={selected?.price ?? e.priceFrom ?? 0}
                      fees={e.fees.total}
                    />
                  ))
              )}
            </View>
          </ScrollView>
        ) : null}
      </QueryState>

      <Sheet
        open={!!selected && !starting}
        onClose={() => setSelectedId(null)}
        title={selected ? plotLabel(selected) : ''}
      >
        {selected && e ? (
          <ReservePanel
            key={selected.id}
            estate={e}
            plot={selected}
            onReserved={(r) => setStarting(r)}
            onRequest={setRequest}
          />
        ) : null}
      </Sheet>
      <Sheet
        open={!!request && !!selected}
        onClose={() => setRequest(null)}
        title={
          request === 'tour' ? 'Ask for a live video tour' : 'Commission an independent inspection'
        }
      >
        {selected && e && request === 'tour' ? (
          <RequestTour
            target={{ plotId: selected.id }}
            landName={`${plotLabel(selected)}, ${e.name}`}
            onDone={() => setRequest(null)}
          />
        ) : selected && e && request === 'inspection' ? (
          <RequestInspection
            target={{ plotId: selected.id }}
            landName={`${plotLabel(selected)}, ${e.name}`}
            onDone={() => setRequest(null)}
          />
        ) : null}
      </Sheet>
      <Sheet open={!!starting} onClose={() => setStarting(null)} title="Start your purchase">
        {starting ? (
          <StartPurchase
            reservation={starting}
            onLeave={() => setStarting(null)}
            onDone={() => {
              setStarting(null);
              setSelectedId(null);
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function Summary({ e }: { e: EstateDetail }) {
  const { spacing } = useTheme();
  const anyReserved = e.plots.some((p) => p.status === 'RESERVED');
  const prices =
    e.priceFrom !== undefined
      ? e.priceTo !== undefined && e.priceTo !== e.priceFrom
        ? `${formatNaira(e.priceFrom)} – ${formatNaira(e.priceTo)}`
        : formatNaira(e.priceFrom)
      : anyReserved
        ? 'All reserved'
        : 'Sold out';
  return (
    <Card style={{ gap: spacing.sm }}>
      <Text variant="caption" color="mutedForeground">
        {e.propertyTitle}
        {e.layoutApprovalReference ? ` · layout approval ${e.layoutApprovalReference}` : ''}
      </Text>
      {e.description ? <Text variant="callout">{e.description}</Text> : null}
      {(
        [
          ['Plots available', `${e.availablePlots} of ${e.totalPlots}`],
          ['Prices', prices],
          ['Reservation hold', `${e.reservationHoldHours} hours`],
          ['Fees per plot', `${formatNaira(e.fees.total)} (due with the deposit)`],
        ] as const
      ).map(([label, value]) => (
        <View
          key={label}
          style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}
        >
          <Text variant="callout" color="mutedForeground">
            {label}
          </Text>
          <Text variant="callout" style={{ fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>
            {value}
          </Text>
        </View>
      ))}
    </Card>
  );
}

function PlotCell({
  plot: p,
  selected,
  onPress,
}: {
  plot: EstatePlot;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${plotLabel(p)}, ${PLOT_STATUS_LABEL[p.status]}, ${formatNaira(p.price)}`}
      style={{ flexBasis: '47%', flexGrow: 1 }}
    >
      <Card
        padding={spacing.md}
        style={{ gap: 2, borderWidth: selected ? 1.5 : 0, borderColor: colors.primary }}
      >
        <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
          {plotLabel(p)}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {Math.round(p.areaSqm).toLocaleString('en-NG')} m²{p.isCorner ? ' · corner' : ''}
        </Text>
        <Text variant="callout">{formatNaira(p.price)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: PLOT_STATUS_COLOR[p.status],
            }}
          />
          <Text variant="caption" color="mutedForeground">
            {PLOT_STATUS_LABEL[p.status]}
          </Text>
        </View>
      </Card>
    </PressableScale>
  );
}

function ReservePanel({
  estate: e,
  plot: p,
  onReserved,
  onRequest,
}: {
  estate: EstateDetail;
  plot: EstatePlot;
  onReserved: (r: Reservation) => void;
  onRequest: (kind: 'tour' | 'inspection') => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { workspaces, refreshProfile } = useAuth();
  const isBuyer = workspaces.includes('buyer');
  const [accepted, setAccepted] = useState(false);
  const [holdForInspection, setHoldForInspection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reservations = useQuery({
    queryKey: qk.buyerLand.reservations,
    queryFn: landBuyerApi.reservations,
    enabled: isBuyer,
  });
  const inspections = useQuery({
    queryKey: qk.buyerLand.inspections,
    queryFn: landBuyerApi.inspections,
    enabled: isBuyer && !!e.reservationTerms.subjectToInspection,
  });
  const myHold = (reservations.data ?? []).find((r) => r.plotId === p.id && r.status === 'ACTIVE');
  const openInspection = (inspections.data ?? []).find(
    (i) => i.plotId === p.id && i.status !== 'ACCEPTED' && i.status !== 'CANCELLED'
  );
  const blocked = (e.openConditions ?? []).length > 0;

  const reserve = useMutation({
    mutationFn: () =>
      landBuyerApi.reserve(
        p.id,
        e.reservationTerms.version,
        holdForInspection ? openInspection?.id : undefined
      ),
    onSuccess: (r) => {
      setError(null);
      qc.invalidateQueries({ queryKey: qk.buyerLand.estate(e.id) });
      qc.invalidateQueries({ queryKey: qk.buyerLand.reservations });
      toast.show(`${plotLabel(p)} is held for you.`, 'success');
      onReserved(r);
    },
    onError: (err) => setError(errorMessage(err, 'Could not reserve the plot.')),
  });
  const addBuyer = useMutation({
    mutationFn: () => accountRolesApi.add('buyer'),
    onSuccess: async () => {
      await refreshProfile();
      toast.show('Buyer account added. You can reserve now.', 'success');
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not add a buyer account.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: 2 }}>
        <Text variant="heading">{formatNaira(p.price)}</Text>
        <Text variant="caption" color="mutedForeground">
          {Math.round(p.areaSqm).toLocaleString('en-NG')} m²
          {p.pricePerSqm ? ` · ${formatNaira(p.pricePerSqm)}/m²` : ''}
          {p.isCorner ? ' · corner plot' : ''}
          {p.tags.length ? ` · ${p.tags.join(', ')}` : ''}
        </Text>
        <Badge
          label={PLOT_STATUS_LABEL[p.status]}
          tone={p.status === 'AVAILABLE' ? 'success' : 'neutral'}
        />
      </View>

      {myHold ? (
        <>
          <Text variant="callout">
            You reserved this plot. Your hold ends {formatDateTime(myHold.expiresAt)}.
          </Text>
          <Button
            label="Choose a plan and start your purchase"
            onPress={() => onReserved(myHold)}
          />
        </>
      ) : p.status !== 'AVAILABLE' ? (
        <Text variant="callout" color="mutedForeground">
          {p.status === 'RESERVED' && p.heldUntil
            ? `This plot is reserved until ${formatDateTime(p.heldUntil)}. It returns to sale if no purchase starts by then.`
            : 'This plot is no longer for sale.'}
        </Text>
      ) : !isBuyer ? (
        <>
          <Text variant="callout" color="mutedForeground">
            Plots are reserved from a buyer account. Add one to this account to hold this plot.
          </Text>
          <Button
            label="Add a buyer account"
            loading={addBuyer.isPending}
            onPress={() => addBuyer.mutate()}
          />
        </>
      ) : (
        <>
          <FormAlert
            tone="info"
            title="Reservation terms"
            message={[
              ...e.reservationTerms.points,
              ...(holdForInspection && e.reservationTerms.subjectToInspection
                ? [e.reservationTerms.subjectToInspection]
                : []),
            ]
              .map((t) => `• ${t}`)
              .join('\n')}
          />
          {e.reservationTerms.subjectToInspection && openInspection ? (
            <SwitchRow
              label="Hold it while my inspection runs"
              description={`Up to ${e.inspectionHoldDays} days, ending two days after your report is ready.`}
              value={holdForInspection}
              onValueChange={setHoldForInspection}
            />
          ) : null}
          <Checkbox
            checked={accepted}
            onChange={setAccepted}
            label="I have read and accept these terms"
          />
          {blocked ? (
            <Text variant="caption" color="mutedForeground">
              Reservations open once the conditions on this estate are met.
            </Text>
          ) : null}
          {error ? <FormAlert tone="error" message={error} /> : null}
          <Button
            label={
              holdForInspection
                ? 'Reserve while my inspection runs'
                : `Reserve for ${e.reservationHoldHours} hours`
            }
            loading={reserve.isPending}
            disabled={!accepted || blocked || reserve.isPending}
            onPress={() => reserve.mutate()}
          />
          <Text variant="caption" color="mutedForeground">
            A reservation is free and holds the plot for {e.reservationHoldHours} hours while you
            choose a plan. You can hold up to 3 plots at a time. Sureground holds your payments and
            releases them to the developer only as you confirm each conveyance step.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Button
              label="Ask for a live video tour"
              size="sm"
              variant="secondary"
              onPress={() => onRequest('tour')}
            />
            <Button
              label="Commission an inspection"
              size="sm"
              variant="secondary"
              onPress={() => onRequest('inspection')}
            />
          </View>
          <Button
            label="See my reservations"
            size="sm"
            variant="ghost"
            onPress={() => router.push('/(app)/buyer-land-reservations')}
            style={{ alignSelf: 'flex-start' }}
          />
        </>
      )}
    </View>
  );
}
