import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import {
  CalendarDays,
  ChevronRight,
  Gavel,
  Home,
  KeyRound,
  Lock,
  MessageSquare,
  ShieldAlert,
  Star,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Button,
  Card,
  Divider,
  EmptyState,
  PressableScale,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { StatusPill, Thumb } from '@/components/host/HostUI';
import { useMyStays } from '@/components/shortlet/useMyStays';
import { GuestPromiseCard, InfoRow, Section, SupportContact } from '@/components/shortlet/StayUI';
import { MessageHostSheet } from '@/components/shortlet/MessageHostSheet';
import { OpenDisputeSheet } from '@/components/shortlet/OpenDisputeSheet';
import { ReviewStaySheet } from '@/components/shortlet/ReviewStaySheet';
import { shortletsApi, type ShortletBooking } from '@/lib/api/shortlets';
import { ApiError } from '@/lib/api/client';
import { isoDay } from '@/lib/hostDates';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import {
  OUTCOME_LABEL,
  discountLabel,
  formatDeadline,
  guestTotal,
  guestsLabel,
  nightsLabel,
  promiseState,
  stayHeadline,
  stayRefund,
  tripDay,
} from '@/lib/stays';

type SheetName = 'message' | 'dispute' | 'review' | null;

/** One booked stay, from the guest's side: where it stands, how to get in, the money. */
export default function StayDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [sheet, setSheet] = useState<SheetName>(null);

  const stays = useMyStays();
  const b = stays.data?.find((x) => x.id === id);
  const refresh = () => qc.invalidateQueries({ queryKey: ['shortlets', 'bookings'] });

  const pay = useMutation({
    mutationFn: () => shortletsApi.payBooking(id),
    onSuccess: async (res) => {
      if (res.authorizationUrl) {
        await WebBrowser.openBrowserAsync(res.authorizationUrl);
      } else {
        toast.show('Payment started.', 'success');
      }
      refresh();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not start payment.', 'error'),
  });

  const cancel = useMutation({
    mutationFn: () => shortletsApi.cancelBooking(id),
    onSuccess: () => {
      void haptics.success();
      toast.show('Stay cancelled.', 'success');
      refresh();
    },
    onError: (e) => toast.show(e instanceof ApiError ? e.message : 'Could not cancel.', 'error'),
  });

  const confirmCancel = (s: ShortletBooking) =>
    Alert.alert(
      'Cancel this stay?',
      s.paymentStatus === 'PAID'
        ? `Your refund follows the ${s.cancellationPolicy.toLowerCase()} cancellation policy. Your deposit is returned in full.`
        : 'Nothing has been charged, so there’s nothing to refund.',
      [
        { text: 'Keep my stay', style: 'cancel' },
        { text: 'Cancel stay', style: 'destructive', onPress: () => cancel.mutate() },
      ]
    );

  if (!b) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <DetailHeader eyebrow="Your stay" title="Stay" onBack={() => router.back()} />
        {stays.isPending ? (
          <>
            <Skeleton height={120} radius={radius.lg} />
            <Skeleton height={200} radius={radius.lg} />
          </>
        ) : (
          <EmptyState
            title="Stay not found"
            description="It may have been removed. Your other stays are in My stays."
          />
        )}
      </View>
    );
  }

  const today = isoDay(new Date());
  const h = stayHeadline(b, today);
  const promise = promiseState(b);
  const paid = b.paymentStatus === 'PAID' || b.paymentStatus === 'REFUNDED';
  const live = b.status === 'REQUESTED' || b.status === 'CONFIRMED';
  const nightsBefore = b.subtotal + (b.discountAmount ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing['2xl'],
        }}
        refreshControl={
          <RefreshControl
            refreshing={stays.isRefetching}
            onRefresh={() => stays.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <DetailHeader
          eyebrow="Your stay"
          title={b.propertyTitle}
          subtitle={b.city}
          onBack={() => router.back()}
        />

        {/* Where it stands */}
        <Card elevated style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Thumb uri={b.coverImageUrl} size={64} />
            <View style={{ flex: 1, gap: 6 }}>
              <StatusPill label={h.pill} tone={h.tone} />
              <Text variant="subheading">{h.title}</Text>
            </View>
          </View>
          {h.detail ? (
            <Text variant="callout" color="mutedForeground">
              {h.detail}
            </Text>
          ) : null}
          {b.cancelledBy === 'HOST' && b.cancellationReason ? (
            <Text variant="callout" color="mutedForeground">
              The host said: “{b.cancellationReason}”
            </Text>
          ) : null}
          {h.action === 'pay' ? (
            <Button
              label={`Pay ₦${(guestTotal(b) + (b.deposit ?? 0)).toLocaleString('en-NG')}`}
              size="lg"
              loading={pay.isPending}
              onPress={() => pay.mutate()}
            />
          ) : h.action === 'review' ? (
            <Button label="Review your stay" onPress={() => setSheet('review')} />
          ) : h.action === 'report' ? (
            <Button
              label="Report a problem"
              variant="outline"
              onPress={() =>
                router.push({ pathname: '/(app)/shortlet-report/[id]', params: { id: b.id } })
              }
            />
          ) : h.action === 'rebook' ? (
            <Button
              label="Find another stay"
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/(app)/shortlets',
                  params: {
                    checkIn: b.checkIn.slice(0, 10),
                    checkOut: b.checkOut.slice(0, 10),
                    guests: String(b.guestCount),
                  },
                })
              }
            />
          ) : null}
        </Card>

        {/* The trip */}
        <View style={{ gap: spacing.lg }}>
          <InfoRow
            icon={CalendarDays}
            title={`${tripDay(b.checkIn)} → ${tripDay(b.checkOut)}`}
            detail={`${nightsLabel(b.nights)} · ${b.checkIn.slice(0, 4)}`}
          />
          <InfoRow icon={Users} title={guestsLabel(b.guestCount)} />
          {b.hostName ? <InfoRow icon={Home} title={`Hosted by ${b.hostName}`} /> : null}
        </View>

        {/* Getting in */}
        {b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? (
          <Section title="Getting in">
            {b.checkInInstructions ? (
              <Card elevated style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <KeyRound size={18} color={colors.primary} />
                  <Text variant="bodyStrong">Check-in instructions</Text>
                </View>
                <Text variant="body" selectable>
                  {b.checkInInstructions}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  Only you and the host can see these: don’t share them.
                </Text>
              </Card>
            ) : (
              <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <Lock size={18} color={colors.mutedForeground} />
                <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
                  {paid
                    ? 'Your host hasn’t added check-in steps yet. Message them to arrange how you’ll get in.'
                    : 'How to get in appears here once you’ve paid.'}
                </Text>
              </Card>
            )}
          </Section>
        ) : null}

        {/* Guest Promise */}
        {promise.kind !== 'none' ? (
          <GuestPromiseCard>
            {promise.kind === 'upcoming' ? (
              <Text variant="callout" style={{ color: colors.foreground, fontWeight: '600' }}>
                You can report a problem from check-in until {formatDeadline(promise.closesAt)}.
              </Text>
            ) : promise.kind === 'open' ? (
              <Button
                label={`Report a problem · until ${formatDeadline(promise.closesAt)}`}
                onPress={() =>
                  router.push({ pathname: '/(app)/shortlet-report/[id]', params: { id: b.id } })
                }
              />
            ) : promise.kind === 'reported' ? (
              <PressableRow
                icon={ShieldAlert}
                title="We’re looking into your report"
                detail="The host isn’t paid while we check. Follow it in Disputes."
                onPress={() => router.push('/(app)/shortlet-disputes')}
              />
            ) : promise.kind === 'decided' ? (
              <Text variant="callout" style={{ color: colors.foreground, fontWeight: '600' }}>
                {OUTCOME_LABEL[promise.outcome]}
                {promise.refundAmount
                  ? ` · ₦${promise.refundAmount.toLocaleString('en-NG')} refunded`
                  : ''}
              </Text>
            ) : (
              <Text variant="callout" color="mutedForeground">
                The 24-hour window for this stay has closed. For anything else, ask support below.
              </Text>
            )}
          </GuestPromiseCard>
        ) : null}

        {/* Money */}
        <Section title="Payment">
          <Card elevated style={{ gap: spacing.sm }}>
            <Line
              label={
                b.nightlyRate && !b.discountAmount
                  ? `₦${b.nightlyRate.toLocaleString('en-NG')} × ${nightsLabel(b.nights)}`
                  : nightsLabel(b.nights)
              }
              amount={nightsBefore}
            />
            {b.discountType && b.discountAmount ? (
              <Line label={discountLabel(b.discountType)} amount={b.discountAmount} credit />
            ) : null}
            {b.cleaningFee ? <Line label="Cleaning fee" amount={b.cleaningFee} /> : null}
            {b.taxAmount ? <Line label="Tax" amount={b.taxAmount} /> : null}
            <Divider style={{ marginVertical: spacing.xs }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="subheading">Total</Text>
              <Price amount={guestTotal(b)} variant="subheading" />
            </View>
            <Text variant="caption" color={paid ? 'success' : 'mutedForeground'}>
              {b.paymentStatus === 'PAID'
                ? `Paid${b.paidAt ? ` ${formatDate(b.paidAt, 'short')}` : ''} · held by GetRentos until you check in`
                : b.paymentStatus === 'REFUNDED'
                  ? 'Refunded'
                  : b.paymentStatus === 'PROCESSING'
                    ? 'Payment being confirmed'
                    : 'Not paid yet'}
            </Text>
            {stayRefund(b) ? (
              <Text variant="callout" style={{ color: colors.success, fontWeight: '600' }}>
                ₦{stayRefund(b)!.toLocaleString('en-NG')} refunded
                {b.refundedAt ? ` on ${formatDate(b.refundedAt, 'short')}` : ''}
              </Text>
            ) : null}
          </Card>

          {b.deposit ? (
            <Card style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodyStrong">Refundable deposit</Text>
                <Price amount={b.deposit} variant="bodyStrong" />
              </View>
              <Text variant="caption" color="mutedForeground">
                {b.depositStatus === 'REFUNDED'
                  ? `Returned${b.depositRefundedAmount != null ? ` · ₦${b.depositRefundedAmount.toLocaleString('en-NG')}` : ''}${b.depositClaimDeducted ? ` after a ₦${b.depositClaimDeducted.toLocaleString('en-NG')} claim` : ''}`
                  : b.depositStatus === 'HELD'
                    ? 'Held by GetRentos and returned after checkout, unless the host reports damage.'
                    : 'Paid with your stay and returned after checkout.'}
              </Text>
              {b.depositClaimStatus === 'PENDING' ? (
                <Text variant="callout" style={{ color: colors.warning, fontWeight: '600' }}>
                  The host has claimed ₦{(b.depositClaimAmount ?? 0).toLocaleString('en-NG')} for
                  damage. Support is reviewing it.
                </Text>
              ) : null}
            </Card>
          ) : null}
        </Section>

        {/* Everything else */}
        <View style={{ gap: spacing.sm }}>
          {b.hostName ? (
            <PressableRow
              icon={MessageSquare}
              title="Message the host"
              onPress={() => setSheet('message')}
            />
          ) : null}
          <PressableRow
            icon={Home}
            title="View the listing"
            onPress={() =>
              router.push({ pathname: '/(app)/shortlet/[id]', params: { id: b.listingId } })
            }
          />
          {b.status === 'COMPLETED' && !b.reviewed ? (
            <PressableRow icon={Star} title="Review your stay" onPress={() => setSheet('review')} />
          ) : null}
          {paid ? (
            <PressableRow
              icon={Gavel}
              title={
                b.depositClaimStatus === 'PENDING'
                  ? 'Dispute the deposit claim'
                  : 'Ask support to step in'
              }
              detail="Open a dispute about this stay"
              onPress={() => setSheet('dispute')}
            />
          ) : null}
          {live ? (
            <PressableRow
              icon={XCircle}
              title="Cancel this stay"
              destructive
              onPress={() => confirmCancel(b)}
            />
          ) : null}
        </View>

        <SupportContact
          lead="Stuck at the gate or need help right now? Talk to us."
          context={`Help with my stay at ${b.propertyTitle} (${b.id.slice(0, 8)})`}
        />
      </ScrollView>

      <MessageHostSheet
        open={sheet === 'message'}
        onClose={() => setSheet(null)}
        listing={{ id: b.listingId, title: b.propertyTitle, hostName: b.hostName ?? 'the host' }}
      />
      <OpenDisputeSheet
        open={sheet === 'dispute'}
        onClose={() => setSheet(null)}
        booking={b}
        defaultCategory={b.depositClaimStatus === 'PENDING' ? 'DAMAGE' : undefined}
      />
      <ReviewStaySheet open={sheet === 'review'} onClose={() => setSheet(null)} booking={b} />
    </View>
  );
}

function Line({ label, amount, credit }: { label: string; amount: number; credit?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text variant="body" color="mutedForeground" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text
        variant="body"
        style={{
          color: credit ? colors.success : colors.foreground,
          fontVariant: ['tabular-nums'],
        }}
      >
        {credit ? '−' : ''}₦{amount.toLocaleString('en-NG')}
      </Text>
    </View>
  );
}

function PressableRow({
  icon: Icon,
  title,
  detail,
  onPress,
  destructive,
}: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors, spacing } = useTheme();
  const tint = destructive ? colors.destructive : colors.foreground;
  return (
    <PressableScale
      onPress={onPress}
      activeScale={0.985}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Icon size={19} color={tint} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" style={{ color: tint }}>
            {title}
          </Text>
          {detail ? (
            <Text variant="caption" color="mutedForeground">
              {detail}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={17} color={colors.mutedForeground} />
      </Card>
    </PressableScale>
  );
}
