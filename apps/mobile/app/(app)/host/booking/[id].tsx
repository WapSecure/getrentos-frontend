import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BadgeCheck,
  CalendarCheck2,
  LogOut,
  MessageCircle,
  Star,
  Users,
} from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  Divider,
  ErrorState,
  FormAlert,
  Price,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DISPUTE_CATEGORIES,
  daysUntil,
  hostShortletsApi,
  relativeDay,
  type DisputeCategory,
  type HostBooking,
} from '@/lib/api/hostShortlets';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { BOOKING_STATUS, StatusPill, Thumb } from '@/components/host/HostUI';

type Panel = 'cancel' | 'claim' | 'dispute' | 'review' | null;

const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

export default function HostBookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [panel, setPanel] = useState<Panel>(null);
  const query = useQuery({
    queryKey: qk.host.booking(id),
    queryFn: () => hostShortletsApi.booking(id),
  });
  const b = query.data;

  const afterChange = (next?: HostBooking) => {
    if (next) qc.setQueryData(qk.host.booking(id), next);
    qc.invalidateQueries({ queryKey: ['host', 'bookings'] });
    qc.invalidateQueries({ queryKey: ['host', 'listing'] });
  };

  const decide = useMutation({
    mutationFn: (action: 'approve' | 'decline') =>
      action === 'approve' ? hostShortletsApi.approve(id) : hostShortletsApi.decline(id),
    onSuccess: (next, action) => {
      void haptics.success();
      afterChange(next);
      toast.show(
        action === 'approve' ? 'Approved. The guest can pay now.' : 'Request declined.',
        'success'
      );
    },
    onError: (e) => {
      void haptics.error();
      toast.show(errText(e, 'That didn’t go through.'), 'error');
    },
  });

  const confirmDecline = () =>
    Alert.alert('Decline this request?', 'The guest is told and can book elsewhere.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => decide.mutate('decline') },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Booking"
          title={b?.guestName ?? 'Guest'}
          subtitle={b?.propertyTitle}
          onBack={() => router.back()}
        />
        {query.isError && !b ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : !b ? (
          <>
            <Skeleton height={150} radius={radius.lg} />
            <Skeleton height={200} radius={radius.lg} />
          </>
        ) : (
          <>
            <StayHero b={b} />
            {b.status === 'CANCELLED' || b.status === 'DECLINED' ? <Ended b={b} /> : null}
            {b.guestSummary ? <GuestCard b={b} /> : null}
            {b.notes ? (
              <Card elevated style={{ gap: spacing.xs }}>
                <Text variant="caption" color="mutedForeground">
                  Message from {b.guestName ?? 'the guest'}
                </Text>
                <Text variant="body">“{b.notes}”</Text>
              </Card>
            ) : null}
            <MoneyCard b={b} />
            <MoreActions b={b} onPanel={setPanel} />
          </>
        )}
      </ScrollView>

      {b?.status === 'REQUESTED' ? (
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Button
            label="Decline"
            variant="secondary"
            style={{ flex: 1 }}
            disabled={decide.isPending}
            onPress={confirmDecline}
          />
          <Button
            label="Approve"
            style={{ flex: 2 }}
            loading={decide.isPending && decide.variables === 'approve'}
            disabled={decide.isPending}
            onPress={() => decide.mutate('approve')}
          />
        </View>
      ) : null}

      <Sheet
        open={!!panel}
        onClose={() => setPanel(null)}
        title={
          panel === 'cancel'
            ? 'Cancel this stay'
            : panel === 'claim'
              ? 'Claim from the deposit'
              : panel === 'dispute'
                ? 'Report a problem'
                : 'Rate your guest'
        }
      >
        {b && panel === 'cancel' ? (
          <CancelForm
            b={b}
            onDone={(n) => {
              afterChange(n);
              setPanel(null);
            }}
          />
        ) : null}
        {b && panel === 'claim' ? (
          <ClaimForm
            b={b}
            onDone={() => {
              afterChange();
              setPanel(null);
            }}
          />
        ) : null}
        {b && panel === 'dispute' ? <DisputeForm b={b} onDone={() => setPanel(null)} /> : null}
        {b && panel === 'review' ? (
          <ReviewForm
            b={b}
            onDone={() => {
              afterChange();
              setPanel(null);
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

/* ---------------------------------- hero ---------------------------------- */

function StayHero({ b }: { b: HostBooking }) {
  const { colors, spacing } = useTheme();
  const s = BOOKING_STATUS[b.status];
  const day = (iso: string) =>
    new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-NG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  return (
    <Card elevated style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <Thumb uri={b.coverImageUrl} size={56} />
        <View style={{ flex: 1, gap: 4 }}>
          <StatusPill label={s.label} tone={s.tone} />
          <Text variant="caption" color="mutedForeground">
            Requested {formatDate(b.createdAt, 'medium')}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <DateBlock
          Icon={CalendarCheck2}
          label="Check-in"
          value={day(b.checkIn)}
          sub={
            b.status === 'CONFIRMED' || b.status === 'REQUESTED'
              ? relativeDay(b.checkIn)
              : undefined
          }
        />
        <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
        <DateBlock
          Icon={LogOut}
          label="Check-out"
          value={day(b.checkOut)}
          sub={`${b.nights} night${b.nights === 1 ? '' : 's'}`}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Users size={16} color={colors.mutedForeground} />
        <Text variant="callout">
          {b.guestCount} guest{b.guestCount === 1 ? '' : 's'}
        </Text>
      </View>
    </Card>
  );
}

function DateBlock({
  Icon,
  label,
  value,
  sub,
}: {
  Icon: typeof LogOut;
  label: string;
  value: string;
  sub?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon size={14} color={colors.mutedForeground} />
        <Text variant="caption" color="mutedForeground">
          {label}
        </Text>
      </View>
      <Text variant="subheading">{value}</Text>
      {sub ? (
        <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function Ended({ b }: { b: HostBooking }) {
  const who =
    b.status === 'DECLINED'
      ? 'You declined this request.'
      : b.cancelledBy === 'HOST'
        ? 'You cancelled this stay.'
        : b.cancelledBy === 'GUEST'
          ? 'The guest cancelled this stay.'
          : 'Support cancelled this stay.';
  return (
    <FormAlert
      tone="info"
      message={`${who}${b.cancellationReason ? ` “${b.cancellationReason}”` : ''}`}
    />
  );
}

/* ---------------------------------- guest --------------------------------- */

function GuestCard({ b }: { b: HostBooking }) {
  const { colors, spacing } = useTheme();
  const g = b.guestSummary!;
  const rows: [string, string, boolean?][] = [
    ['Identity', g.identityVerified ? 'Verified' : 'Not verified yet', !g.identityVerified],
    ['Stays on GetRentos', String(g.completedStays)],
    [
      'Host ratings',
      g.ratingCount ? `★ ${g.ratingAverage?.toFixed(1)} from ${g.ratingCount}` : 'None yet',
    ],
    [
      'Member since',
      new Date(g.memberSince).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }),
    ],
    ['Cancelled (12 months)', String(g.cancellations12m), g.cancellations12m > 1],
    ['Damage claims upheld', String(g.damageClaimsUpheld), g.damageClaimsUpheld > 0],
  ];
  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          About {b.guestName ?? 'the guest'}
        </Text>
        {g.identityVerified ? <BadgeCheck size={18} color={colors.success} /> : null}
      </View>
      {rows.map(([k, v, warn]) => (
        <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="callout" color="mutedForeground">
            {k}
          </Text>
          <Text
            variant="callout"
            style={{ fontWeight: '600', color: warn ? colors.warning : colors.foreground }}
          >
            {v}
          </Text>
        </View>
      ))}
      <Text variant="caption" color="mutedForeground">
        Counted across GetRentos only.
      </Text>
    </Card>
  );
}

/* ---------------------------------- money --------------------------------- */

function MoneyCard({ b }: { b: HostBooking }) {
  const { colors, spacing } = useTheme();
  const lines: [string, number, boolean?][] = [];
  if (b.nightlyRate)
    lines.push([
      `${naira(b.nightlyRate)} × ${b.nights} night${b.nights === 1 ? '' : 's'}`,
      b.subtotal + (b.discountAmount ?? 0),
    ]);
  if (b.discountAmount)
    lines.push([
      `${b.discountType ? b.discountType.toLowerCase().replace('_', '-') : ''} discount`.trim(),
      -b.discountAmount,
    ]);
  if (b.cleaningFee) lines.push(['Cleaning', b.cleaningFee]);
  if (b.taxAmount) lines.push(['Tax', b.taxAmount]);
  const paid = b.paymentStatus === 'PAID';
  return (
    <Card elevated style={{ gap: spacing.md }}>
      <Text variant="bodyStrong">Money</Text>
      {lines.map(([k, v]) => (
        <Row key={k} label={k} value={v < 0 ? `−${naira(-v)}` : naira(v)} />
      ))}
      <Divider />
      <Row label="Guest pays" value={naira(b.total)} strong />
      {b.platformFee ? <Row label="GetRentos fee" value={`−${naira(b.platformFee)}`} /> : null}
      {b.hostNet != null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            You earn
          </Text>
          <Price amount={b.hostNet} variant="heading" />
        </View>
      ) : null}
      <Text
        variant="caption"
        color={paid ? 'mutedForeground' : undefined}
        style={paid ? undefined : { color: colors.warning }}
      >
        {b.paymentStatus === 'PAID'
          ? `Paid${b.paidAt ? ` ${formatDate(b.paidAt, 'medium')}` : ''} · released to you after check-in`
          : b.paymentStatus === 'REFUNDED'
            ? 'Refunded to the guest'
            : b.status === 'CONFIRMED'
              ? 'Waiting for the guest to pay'
              : 'Not paid yet'}
      </Text>
      {b.deposit ? (
        <>
          <Divider />
          <Row
            label="Security deposit"
            value={
              b.depositStatus === 'HELD'
                ? `${naira(b.deposit)} held`
                : b.depositStatus === 'REFUNDED'
                  ? `${naira(b.depositRefundedAmount ?? b.deposit)} returned`
                  : `${naira(b.deposit)} due`
            }
          />
          {b.depositClaimStatus ? (
            <Text variant="caption" color="mutedForeground">
              {b.depositClaimStatus === 'PENDING'
                ? `Your claim of ${naira(b.depositClaimAmount ?? 0)} is with an admin.`
                : b.depositClaimStatus === 'REJECTED'
                  ? 'Your deposit claim was not upheld.'
                  : `Claim ${b.depositClaimStatus.toLowerCase()}: ${naira(b.depositClaimDeducted ?? 0)} kept for you.`}
            </Text>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text
        variant={strong ? 'bodyStrong' : 'callout'}
        color={strong ? undefined : 'mutedForeground'}
        style={{ textTransform: 'none' }}
      >
        {label}
      </Text>
      <Text
        variant={strong ? 'bodyStrong' : 'callout'}
        style={{ fontWeight: strong ? '700' : '600' }}
      >
        {value}
      </Text>
    </View>
  );
}

/* --------------------------------- actions -------------------------------- */

function MoreActions({ b, onPanel }: { b: HostBooking; onPanel: (p: Panel) => void }) {
  const { spacing } = useTheme();
  const active = b.status === 'CONFIRMED' || b.status === 'COMPLETED';
  const canCancel = b.status === 'CONFIRMED' && daysUntil(b.checkIn) > 0;
  const canClaim = active && b.depositStatus === 'HELD' && b.depositClaimStatus !== 'PENDING';
  const canReview = b.status === 'COMPLETED' && !b.guestReviewed;
  return (
    <View style={{ gap: spacing.sm }}>
      <Button
        label="Guest messages"
        variant="secondary"
        icon={<MessageCircle size={16} />}
        onPress={() => router.push('/(app)/host/inbox')}
      />
      {canReview ? (
        <Button
          label="Rate your guest"
          variant="secondary"
          icon={<Star size={16} />}
          onPress={() => onPanel('review')}
        />
      ) : null}
      {canClaim ? (
        <Button
          label="Claim from the deposit"
          variant="secondary"
          onPress={() => onPanel('claim')}
        />
      ) : null}
      {active ? (
        <Button label="Report a problem" variant="ghost" onPress={() => onPanel('dispute')} />
      ) : null}
      {canCancel ? (
        <Button label="Cancel this stay" variant="ghost" onPress={() => onPanel('cancel')} />
      ) : null}
      {b.status === 'COMPLETED' && b.guestReviewed ? (
        <Text variant="caption" color="mutedForeground" center>
          You’ve rated this guest.
        </Text>
      ) : null}
    </View>
  );
}

function CancelForm({ b, onDone }: { b: HostBooking; onDone: (next: HostBooking) => void }) {
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const preview = useQuery({
    queryKey: ['host', 'booking', b.id, 'cancel-preview'],
    queryFn: () => hostShortletsApi.cancelPreview(b.id),
  });
  const cancel = useMutation({
    mutationFn: () => hostShortletsApi.cancel(b.id, reason.trim()),
    onSuccess: (next) => {
      void haptics.success();
      toast.show('Stay cancelled. The guest has been refunded and told.', 'success');
      onDone(next);
    },
  });
  const p = preview.data;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        {preview.isPending ? (
          <Skeleton height={90} radius={radius.md} />
        ) : !p ? (
          <FormAlert
            message={errText(preview.error, 'Could not work out what cancelling would cost.')}
          />
        ) : !p.canCancel ? (
          <FormAlert message={p.blockedReason ?? 'This stay can’t be cancelled now.'} />
        ) : (
          <View
            style={{
              gap: spacing.sm,
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.warningSubtle,
            }}
          >
            <Text variant="callout" style={{ fontWeight: '700' }}>
              {p.daysBeforeCheckIn} day{p.daysBeforeCheckIn === 1 ? '' : 's'} before check-in
            </Text>
            <Text variant="callout">
              {p.guestPaid
                ? `The guest gets ${naira(p.guestRefund)} back in full.`
                : 'The guest hasn’t paid, so nothing is refunded.'}
            </Text>
            <Text variant="callout">
              {p.fee
                ? `A ${p.feePercent}% cancellation fee of ${naira(p.fee)} comes out of your next payouts.`
                : 'No cancellation fee this time.'}
            </Text>
            <Text variant="caption" color="mutedForeground">
              Those nights stay closed, and your cancellation shows on the listing for a year.
            </Text>
          </View>
        )}
        {p?.canCancel ? (
          <>
            <TextField
              label="Tell the guest why"
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={500}
              hint="At least 10 characters. The guest sees this."
            />
            {cancel.error ? (
              <FormAlert message={errText(cancel.error, 'Could not cancel.')} />
            ) : null}
            <Button
              label="Cancel the stay"
              variant="destructive"
              disabled={reason.trim().length < 10}
              loading={cancel.isPending}
              onPress={() => cancel.mutate()}
            />
          </>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function ClaimForm({ b, onDone }: { b: HostBooking; onDone: () => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const value = Number(amount.replace(/\D/g, '')) || 0;
  const max = b.deposit ?? 0;
  const claim = useMutation({
    mutationFn: () => hostShortletsApi.openDepositClaim(b.id, value, reason.trim()),
    onSuccess: () => {
      void haptics.success();
      toast.show('Claim filed. An admin reviews it and tells you both.', 'success');
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <Text variant="callout" color="mutedForeground">
          Up to {naira(max)} held. Explain what was damaged or missing; an admin decides, and the
          rest goes back to the guest.
        </Text>
        <TextField
          label="Amount (₦)"
          keyboardType="number-pad"
          value={value ? value.toLocaleString('en-NG') : ''}
          onChangeText={setAmount}
          error={value > max ? `The deposit is ${naira(max)}.` : null}
        />
        <TextField
          label="What happened"
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={2000}
          hint="Be specific: which item, what condition, what it costs to fix."
        />
        {claim.error ? (
          <FormAlert message={errText(claim.error, 'Could not file the claim.')} />
        ) : null}
        <Button
          label="File claim"
          disabled={!value || value > max || reason.trim().length < 10}
          loading={claim.isPending}
          onPress={() => claim.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function DisputeForm({ b, onDone }: { b: HostBooking; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [category, setCategory] = useState<DisputeCategory>('DAMAGE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const open = useMutation({
    mutationFn: () =>
      hostShortletsApi.openDispute(b.id, {
        category,
        title: title.trim(),
        description: description.trim(),
      }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.host.disputes });
      toast.show('Reported. Support is on it and the guest has been told.', 'success');
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {DISPUTE_CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              selected={category === c.value}
              onPress={() => setCategory(c.value)}
            />
          ))}
        </View>
        <TextField label="In a few words" value={title} onChangeText={setTitle} maxLength={120} />
        <TextField
          label="What happened"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={2000}
          hint="Dates, what you saw, and what you’d like done."
        />
        {open.error ? <FormAlert message={errText(open.error, 'Could not report it.')} /> : null}
        <Button
          label="Send to support"
          disabled={title.trim().length < 5 || description.trim().length < 20}
          loading={open.isPending}
          onPress={() => open.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function ReviewForm({ b, onDone }: { b: HostBooking; onDone: () => void }) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const send = useMutation({
    mutationFn: () => hostShortletsApi.reviewGuest(b.id, rating, comment.trim() || undefined),
    onSuccess: () => {
      void haptics.success();
      toast.show('Thanks — other hosts will see your rating.', 'success');
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}
          accessibilityRole="adjustable"
          accessibilityLabel="Rating"
          accessibilityValue={{ text: `${rating} of 5` }}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => {
                void haptics.tap();
                setRating(n);
              }}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
            >
              <Star
                size={36}
                color={colors.warning}
                fill={n <= rating ? colors.warning : 'transparent'}
              />
            </Pressable>
          ))}
        </View>
        <TextField
          label="How was hosting them? (optional)"
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={1000}
        />
        {send.error ? <FormAlert message={errText(send.error, 'Could not send it.')} /> : null}
        <Button
          label="Submit rating"
          disabled={!rating}
          loading={send.isPending}
          onPress={() => send.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
