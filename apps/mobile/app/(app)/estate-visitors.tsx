import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Share, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Share2, Ticket } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { HouseholdPicker } from '@/components/estate/HouseholdPicker';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { useEstate } from '@/hooks/useEstate';
import {
  estateManagerApi,
  type Household,
  type IssuedVisitorPass,
  type Tone,
} from '@/lib/api/estateManager';
import type { VisitorPass } from '@/lib/api/visitor-pass';
import { gatemanApi } from '@/lib/api/gateman';
import { formatDate, formatTime, relativeTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

type View_ =
  | 'CHECKED_IN'
  | 'AWAITING_APPROVAL'
  | 'PENDING'
  | 'APPROVED'
  | 'CHECKED_OUT'
  | 'DENIED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'all';
const VIEWS: { value: View_; label: string }[] = [
  { value: 'CHECKED_IN', label: 'Inside now' },
  // A walk-in at the gate, waiting for the household to say yes.
  { value: 'AWAITING_APPROVAL', label: 'Waiting on resident' },
  { value: 'PENDING', label: 'Expected' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'CHECKED_OUT', label: 'Left' },
  { value: 'DENIED', label: 'Refused' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'REVOKED', label: 'Revoked' },
  { value: 'all', label: 'All' },
];

/** How long a pass the office issues stays valid. The API's default is 24 hours. */
const VALIDITY: { hours: number; label: string }[] = [
  { hours: 24, label: '24 hours' },
  { hours: 72, label: '3 days' },
  { hours: 24 * 7, label: '1 week' },
  { hours: 24 * 14, label: '2 weeks' },
];

const STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Expected', tone: 'info' },
  awaiting_approval: { label: 'Waiting on resident', tone: 'warning' },
  approved: { label: 'Approved', tone: 'info' },
  checked_in: { label: 'Inside', tone: 'success' },
  checked_out: { label: 'Left', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'neutral' },
  revoked: { label: 'Revoked', tone: 'neutral' },
  denied: { label: 'Refused', tone: 'danger' },
};
const SOURCE: Record<string, string> = {
  resident: 'Invited by the resident',
  gate: 'Walk-in at the gate',
  contractor: 'Contractor pass',
};

/** Who is inside, who is expected, and a pass the office can issue for a household. */
export default function EstateVisitors() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [view, setView] = useState<View_>('CHECKED_IN');
  const [issuing, setIssuing] = useState(false);
  const [idFor, setIdFor] = useState<VisitorPass | null>(null);

  const query = useInfiniteQuery({
    queryKey: qk.estateManager.visitorPasses(estateId, view),
    queryFn: ({ pageParam }) =>
      estateManagerApi.visitorPasses(estateId, {
        page: pageParam,
        status: view === 'all' ? undefined : view,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!estateId,
  });
  const items = useMemo<VisitorPass[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );
  const total = query.data?.pages[0]?.total ?? 0;

  const revoke = useMutation({
    mutationFn: (p: VisitorPass) => estateManagerApi.revokeVisitorPass(estateId, p.id),
    onSuccess: (_p, p) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'visitor-passes'] });
      toast.show(`${p.visitorName}’s pass is revoked.`, 'success');
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'visitor-passes'] });
      toast.show(errorText(e, 'Could not revoke this pass.'), 'error');
    },
  });

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.md,
          gap: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow={estate?.name ?? 'Gate'}
          title="Visitors"
          subtitle={
            query.data
              ? view === 'CHECKED_IN'
                ? `${total} inside right now`
                : view === 'PENDING'
                  ? `${total} expected`
                  : view === 'AWAITING_APPROVAL'
                    ? `${total} waiting on a resident`
                    : `${total.toLocaleString('en-NG')} passes`
              : undefined
          }
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="Issue a visitor pass"
              disabled={!estateId}
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setIssuing(true)}
            />
          }
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {VIEWS.map((v) => (
            <Chip
              key={v.value}
              label={v.label}
              selected={view === v.value}
              onPress={() => setView(v.value)}
            />
          ))}
        </ScrollView>
      </View>

      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={104} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(p) => p.id}
          refreshControl={refresh}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: VisitorPass }) => {
            const s = STATUS[item.status] ?? { label: item.status, tone: 'neutral' as const };
            return (
              <Card elevated style={{ gap: spacing.sm }}>
                <View
                  accessible
                  accessibilityLabel={`${item.visitorName}, visiting ${item.unitLabel}, ${s.label}. ${SOURCE[item.source] ?? ''}`}
                  style={{ gap: spacing.xs }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                      {item.visitorName}
                    </Text>
                    <StatusPill label={s.label} tone={s.tone} />
                  </View>
                  <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                    {item.unitLabel} · {item.residentName}
                    {item.purpose ? ` · ${item.purpose}` : ''}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    {SOURCE[item.source] ?? 'Visitor pass'} ·{' '}
                    {item.checkedOutAt
                      ? `left ${relativeTime(item.checkedOutAt)}`
                      : item.checkedInAt
                        ? `in since ${formatTime(item.checkedInAt)}, ${formatDate(item.checkedInAt, 'short')}`
                        : `valid until ${formatDate(item.expiresAt, 'short')} ${formatTime(item.expiresAt)}`}
                  </Text>
                  {item.denialReason ? (
                    <Text variant="caption" color="mutedForeground">
                      Refused: {item.denialReason}
                    </Text>
                  ) : null}
                </View>
                {item.checkedInAt ? (
                  <Button
                    label="View ID"
                    size="sm"
                    variant="ghost"
                    accessibilityLabel={`View the ID recorded for ${item.visitorName}`}
                    onPress={() => setIdFor(item)}
                  />
                ) : null}
                {item.status === 'pending' ? (
                  <Button
                    label="Revoke pass"
                    size="sm"
                    variant="ghost"
                    loading={revoke.isPending && revoke.variables?.id === item.id}
                    accessibilityLabel={`Revoke ${item.visitorName}’s pass`}
                    onPress={() =>
                      Alert.alert(
                        `Revoke ${item.visitorName}’s pass?`,
                        'The code stops working at the gate.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Revoke',
                            style: 'destructive',
                            onPress: () => revoke.mutate(item),
                          },
                        ]
                      )
                    }
                  />
                ) : null}
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon={<Ticket size={34} color={colors.mutedForeground} />}
              title={
                view === 'CHECKED_IN'
                  ? 'No visitors inside'
                  : view === 'PENDING'
                    ? 'Nobody expected'
                    : view === 'AWAITING_APPROVAL'
                      ? 'Nobody waiting'
                      : view === 'all'
                        ? 'No visitor passes yet'
                        : `No ${VIEWS.find((v) => v.value === view)?.label.toLowerCase()} passes`
              }
              description={
                view === 'CHECKED_IN'
                  ? 'Visitors the gate has let in and not yet logged out appear here.'
                  : view === 'AWAITING_APPROVAL'
                    ? 'Walk-ins the gate has asked a household about show here until they answer.'
                    : 'Residents invite their own visitors. You can also issue a pass for a household.'
              }
            />
          }
        />
      )}

      <Sheet open={issuing} onClose={() => setIssuing(false)} title="Issue a visitor pass">
        {issuing ? <IssueForm estateId={estateId} onDone={() => setIssuing(false)} /> : null}
      </Sheet>
      <Sheet
        open={!!idFor}
        onClose={() => setIdFor(null)}
        title={idFor ? `${idFor.visitorName}’s ID` : 'Visitor ID'}
      >
        {idFor ? <IdCheckView estateId={estateId} pass={idFor} /> : null}
      </Sheet>
    </View>
  );
}

function IssueForm({ estateId, onDone }: { estateId: string; onDone: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const [household, setHousehold] = useState<Household | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [validHours, setValidHours] = useState(24);
  const [issued, setIssued] = useState<IssuedVisitorPass | null>(null);

  const issue = useMutation({
    mutationFn: () =>
      estateManagerApi.issueVisitorPass(estateId, {
        householdId: household!.id,
        visitorName: name.trim(),
        ...(phone.trim() ? { visitorPhone: phone.trim() } : {}),
        ...(purpose.trim() ? { purpose: purpose.trim() } : {}),
        // Only sent when longer than the API's own 24-hour default.
        ...(validHours !== 24
          ? { expiresAt: new Date(Date.now() + validHours * 3_600_000).toISOString() }
          : {}),
      }),
    onSuccess: (pass) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'visitor-passes'] });
      setIssued(pass);
    },
  });

  if (issued) {
    return (
      <View style={{ gap: spacing.md, alignItems: 'center' }}>
        <Text variant="callout" color="mutedForeground" center>
          {issued.visitorName} shows this at the gate for {issued.unitLabel}.
        </Text>
        <Image
          source={{ uri: issued.qrDataUrl }}
          accessibilityLabel="QR code for this visitor pass"
          contentFit="contain"
          // Always on white: a QR code needs the contrast in dark mode too.
          style={{ width: 200, height: 200, borderRadius: radius.md, backgroundColor: '#fff' }}
        />
        <View accessible accessibilityLabel={`Pass code ${issued.pin.split('').join(' ')}`}>
          <Text variant="display" style={{ letterSpacing: 6 }} selectable>
            {issued.pin}
          </Text>
        </View>
        <Text variant="caption" color="mutedForeground" center>
          Valid until {formatDate(issued.expiresAt, 'medium')} at {formatTime(issued.expiresAt)}.
          The code is shown only now.
        </Text>
        <Button
          label="Share the code"
          icon={<Share2 size={16} color={colors.primaryForeground} />}
          onPress={() =>
            Share.share({
              message: `Your visitor code for ${issued.unitLabel} is ${issued.pin}. Show it at the gate. Valid until ${formatDate(issued.expiresAt, 'medium')} ${formatTime(issued.expiresAt)}.`,
            })
          }
        />
        <Button label="Done" variant="secondary" onPress={onDone} />
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <HouseholdPicker
        estateId={estateId}
        value={household}
        onChange={setHousehold}
        label="Who are they visiting"
      />
      <TextField label="Visitor’s name" value={name} onChangeText={setName} maxLength={120} />
      <TextField
        label="Visitor’s phone (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={30}
      />
      <TextField
        label="Purpose (optional)"
        value={purpose}
        onChangeText={setPurpose}
        maxLength={200}
        placeholder="e.g. Plumber, family visit"
      />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">Valid for</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {VALIDITY.map((v) => (
            <Chip
              key={v.hours}
              label={v.label}
              selected={validHours === v.hours}
              onPress={() => setValidHours(v.hours)}
            />
          ))}
        </View>
      </View>
      {issue.error ? (
        <FormAlert message={errorText(issue.error, 'Could not issue the pass.')} />
      ) : null}
      <Button
        label="Issue pass"
        disabled={!household || name.trim().length < 2}
        loading={issue.isPending}
        onPress={() => issue.mutate()}
      />
    </View>
  );
}

/** The identity document the gate recorded for a visitor, if any. */
function IdCheckView({ estateId, pass }: { estateId: string; pass: VisitorPass }) {
  const { spacing, radius, colors } = useTheme();
  const check = useQuery({
    queryKey: ['estate-manager', estateId, 'visitor-passes', pass.id, 'id-check'],
    queryFn: () => gatemanApi.getVisitorIdCheck(estateId, pass.id),
  });

  if (check.isPending) return <Skeleton height={220} radius={radius.lg} />;
  if (check.isError) {
    return <FormAlert message={errorText(check.error, 'Could not load the ID for this visit.')} />;
  }
  const doc = check.data;
  if (!doc) {
    return (
      <Text variant="callout" color="mutedForeground">
        The gate didn’t record an ID for this visit.
      </Text>
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="bodyStrong">{doc.documentTypeLabel}</Text>
      <Text variant="caption" color="mutedForeground">
        Checked {formatDate(doc.checkedAt, 'medium')} at {formatTime(doc.checkedAt)}
        {doc.checkedByName ? ` by ${doc.checkedByName}` : ''}
      </Text>
      {doc.documentUrl && doc.mimeType.startsWith('image/') ? (
        <Image
          source={{ uri: doc.documentUrl }}
          accessibilityLabel={`${doc.documentTypeLabel} for ${pass.visitorName}`}
          contentFit="contain"
          style={{
            width: '100%',
            height: 260,
            borderRadius: radius.md,
            backgroundColor: colors.muted,
          }}
        />
      ) : null}
      {doc.documentWithheld || doc.notice ? (
        <Text variant="caption" color="mutedForeground">
          {doc.notice ?? 'The document itself is no longer kept.'}
        </Text>
      ) : null}
    </View>
  );
}
