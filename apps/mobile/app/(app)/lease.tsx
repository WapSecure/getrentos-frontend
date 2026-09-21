import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  ShieldCheck,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Price,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { leaseApi } from '@/lib/api/lease';
import { ApiError } from '@/lib/api/client';
import { SignaturePad } from '@/components/lease/SignaturePad';
import { DownloadLeaseButton } from '@/components/lease/DownloadLeaseButton';
import { LeaseTerminationSheet } from '@/components/lease/LeaseTerminationSheet';
import { formatDate, formatNaira } from '@/lib/format';

const LEASE_STATUS_TONE = { active: 'success', expiring: 'warning', expired: 'danger' } as const;
const PAYMENT_ROW_TONE = { paid: 'success', pending: 'warning', overdue: 'danger' } as const;

export default function LeaseScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const [terminationSheetOpen, setTerminationSheetOpen] = useState(false);

  const leaseQuery = useQuery({
    queryKey: qk.renter.lease,
    queryFn: leaseApi.getLease,
    retry: false,
  });
  const noActiveLease =
    leaseQuery.isError && leaseQuery.error instanceof ApiError && leaseQuery.error.status === 404;

  const pendingQuery = useQuery({
    queryKey: qk.renter.pendingLease,
    queryFn: leaseApi.getPendingLease,
    enabled: noActiveLease,
  });

  const remindersQuery = useQuery({
    queryKey: qk.renter.leasePaymentReminders,
    queryFn: leaseApi.getUpcomingPaymentReminders,
  });

  const rentIncreasesQuery = useQuery({
    queryKey: qk.renter.leaseRentIncreases,
    queryFn: leaseApi.getRentIncreases,
  });

  const renewalQuery = useQuery({
    queryKey: qk.renter.renewalOffer,
    queryFn: leaseApi.getRenewalOffer,
    enabled: !!leaseQuery.data,
  });

  const header = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingTop: insets.top + 8,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.sm,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={10}
      >
        <ChevronLeft size={24} color={colors.foreground} />
      </Pressable>
      <Text variant="title">Lease</Text>
    </View>
  );

  if (leaseQuery.isLoading || (noActiveLease && pendingQuery.isLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {header}
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={120} radius={16} />
          <Skeleton height={200} radius={16} />
        </View>
      </View>
    );
  }

  if (leaseQuery.isError && !noActiveLease) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {header}
        <ErrorState onRetry={() => leaseQuery.refetch()} />
      </View>
    );
  }

  if (noActiveLease) {
    if (pendingQuery.data) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {header}
          <PendingLeaseView pending={pendingQuery.data} />
        </View>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {header}
        <EmptyState
          icon={<Home size={34} color={colors.mutedForeground} />}
          title="No lease yet"
          description="Once your application is approved and a lease is sent to you, it will appear here for signing."
        />
      </View>
    );
  }

  const lease = leaseQuery.data!;
  const recentPayments = lease.paymentHistory.slice(-3).reverse();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {header}
      <Screen padded>
        <Card elevated>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: spacing.sm,
            }}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text variant="bodyStrong">{lease.propertyName}</Text>
              <Text variant="caption" color="mutedForeground">
                {lease.address}
              </Text>
            </View>
            <Badge
              label={lease.status[0].toUpperCase() + lease.status.slice(1)}
              tone={LEASE_STATUS_TONE[lease.status]}
            />
          </View>
          <Divider style={{ marginVertical: spacing.md }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text variant="caption" color="mutedForeground">
                Rent
              </Text>
              <Price amount={lease.rentAmount} period="month" variant="bodyStrong" />
            </View>
            <View>
              <Text variant="caption" color="mutedForeground">
                Security deposit
              </Text>
              <Price amount={lease.securityDeposit} variant="bodyStrong" />
            </View>
          </View>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md }}
          >
            <Calendar size={13} color={colors.mutedForeground} />
            <Text variant="caption" color="mutedForeground">
              {formatDate(lease.startDate, 'short')} – {formatDate(lease.endDate, 'short')}
            </Text>
          </View>
        </Card>

        {renewalQuery.data && renewalQuery.data.status === 'pending' ? (
          <RenewalOfferCard offer={renewalQuery.data} />
        ) : null}

        <Card elevated>
          <Text variant="bodyStrong" style={{ marginBottom: spacing.sm }}>
            Landlord
          </Text>
          <Text variant="body">{lease.landlord.name}</Text>
          {lease.landlord.phone ? (
            <Text variant="caption" color="mutedForeground">
              {lease.landlord.phone}
            </Text>
          ) : null}
          {lease.landlord.email ? (
            <Text variant="caption" color="mutedForeground">
              {lease.landlord.email}
            </Text>
          ) : null}
        </Card>

        {lease.documents.length > 0 ? (
          <Card elevated padding="none">
            {lease.documents.map((doc, i) => (
              <View key={doc.name}>
                {i > 0 ? <Divider /> : null}
                <Pressable
                  onPress={() => Linking.openURL(doc.url)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: spacing.lg,
                  }}
                >
                  <FileText size={16} color={colors.mutedForeground} />
                  <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </Card>
        ) : null}

        <View style={{ gap: spacing.md }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text variant="heading">Payments</Text>
            <Pressable
              onPress={() => router.push('/(app)/payments')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
            >
              <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
                See all
              </Text>
              <ChevronRight size={15} color={colors.primary} />
            </Pressable>
          </View>
          {recentPayments.length === 0 ? (
            <Text variant="callout" color="mutedForeground">
              No payments recorded yet.
            </Text>
          ) : (
            <Card elevated padding="none">
              {recentPayments.map((p, i) => (
                <View key={`${p.month}-${p.date}`}>
                  {i > 0 ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: spacing.lg,
                    }}
                  >
                    <Text variant="callout">{p.month}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Price amount={p.amount} variant="callout" />
                      <Badge
                        label={p.status[0].toUpperCase() + p.status.slice(1)}
                        tone={PAYMENT_ROW_TONE[p.status]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>

        {(remindersQuery.data ?? []).length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <Text variant="heading">Coming up</Text>
            <Card elevated padding="none">
              {(remindersQuery.data ?? []).map((r, i) => (
                <View key={r.id}>
                  {i > 0 ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: spacing.lg,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="callout">{r.propertyName}</Text>
                      <Text variant="caption" color="mutedForeground">
                        Due {formatDate(r.dueDate)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Price amount={r.amount} variant="callout" />
                      <Badge
                        label={
                          r.daysRemaining <= 0
                            ? 'Due now'
                            : `in ${r.daysRemaining} day${r.daysRemaining === 1 ? '' : 's'}`
                        }
                        tone={r.daysRemaining <= 3 ? 'warning' : 'neutral'}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {(rentIncreasesQuery.data ?? []).length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <Text variant="heading">Rent history</Text>
            <Card elevated padding="none">
              {(rentIncreasesQuery.data ?? []).map((inc, i) => (
                <View key={`${inc.date}-${inc.newAmount}`}>
                  {i > 0 ? <Divider /> : null}
                  <View style={{ padding: spacing.lg, gap: 4 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text variant="callout">{formatDate(inc.date)}</Text>
                      <Badge
                        label={`${inc.percentageChange > 0 ? '+' : ''}${inc.percentageChange}%`}
                        tone={inc.percentageChange > 0 ? 'warning' : 'success'}
                      />
                    </View>
                    <Text variant="caption" color="mutedForeground">
                      {formatNaira(inc.oldAmount)} → {formatNaira(inc.newAmount)}
                      {inc.reason ? ` · ${inc.reason}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <DownloadLeaseButton />

        {lease.status !== 'expired' ? (
          <Pressable
            onPress={() => setTerminationSheetOpen(true)}
            style={{ alignItems: 'center', paddingVertical: spacing.sm }}
          >
            <Text variant="callout" color="destructive">
              Request lease termination
            </Text>
          </Pressable>
        ) : null}
      </Screen>

      <LeaseTerminationSheet
        open={terminationSheetOpen}
        onClose={() => setTerminationSheetOpen(false)}
      />
    </View>
  );
}

function RenewalOfferCard({
  offer,
}: {
  offer: NonNullable<Awaited<ReturnType<typeof leaseApi.getRenewalOffer>>>;
}) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: (action: 'accept' | 'decline') => leaseApi.respondRenewalOffer(offer.id, action),
    onSuccess: (_data, action) => {
      qc.invalidateQueries({ queryKey: qk.renter.renewalOffer });
      qc.invalidateQueries({ queryKey: qk.renter.lease });
      toast.show(action === 'accept' ? 'Renewal accepted.' : 'Renewal declined.', 'success');
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not respond to the offer.',
        'error'
      ),
  });

  return (
    <Card elevated style={{ backgroundColor: colors.accent }}>
      <Text variant="bodyStrong">Renewal offer</Text>
      <Text variant="callout" color="mutedForeground" style={{ marginTop: 2 }}>
        New rent <Price amount={offer.newRentAmount} period="month" variant="callout" /> (
        {offer.increasePercentage > 0 ? '+' : ''}
        {offer.increasePercentage}%) · ends {formatDate(offer.newEndDate, 'short')}
      </Text>
      {offer.terms ? (
        <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.xs }}>
          {offer.terms}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button
            label="Decline"
            variant="secondary"
            loading={mutation.isPending}
            onPress={() => mutation.mutate('decline')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Accept"
            loading={mutation.isPending}
            onPress={() => mutation.mutate('accept')}
          />
        </View>
      </View>
    </Card>
  );
}

function PendingLeaseView({ pending }: { pending: import('@/lib/api/lease').PendingLease }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [signature, setSignature] = useState<string | null>(null);

  const signMutation = useMutation({
    mutationFn: () => leaseApi.sign(pending.id, signature!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.pendingLease });
      qc.invalidateQueries({ queryKey: qk.renter.lease });
      toast.show('Lease signed.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not sign the lease.', 'error'),
  });

  return (
    <Screen padded>
      <Card elevated>
        <Text variant="label" color="primary" uppercase>
          Awaiting your signature
        </Text>
        <Text variant="title" style={{ marginTop: 4 }}>
          {pending.propertyName}
        </Text>
        <Text variant="callout" color="mutedForeground">
          {pending.address} · {pending.unitName}
        </Text>
        <Divider style={{ marginVertical: spacing.md }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text variant="caption" color="mutedForeground">
              Rent
            </Text>
            <Price amount={pending.rentAmount} period="month" variant="bodyStrong" />
          </View>
          {pending.securityDeposit ? (
            <View>
              <Text variant="caption" color="mutedForeground">
                Deposit
              </Text>
              <Price amount={pending.securityDeposit} variant="bodyStrong" />
            </View>
          ) : null}
        </View>
        <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.md }}>
          {formatDate(pending.startDate, 'short')} – {formatDate(pending.endDate, 'short')}
        </Text>
      </Card>

      <Card elevated>
        <Text variant="bodyStrong" style={{ marginBottom: spacing.sm }}>
          Your signature
        </Text>
        <SignaturePad onChange={setSignature} />
      </Card>

      {pending.landlordSigned ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={14} color="#16a34a" />
          <Text variant="caption" color="mutedForeground">
            Your landlord has already signed
          </Text>
        </View>
      ) : null}

      <Button
        label="Sign lease"
        disabled={!signature}
        loading={signMutation.isPending}
        onPress={() => signMutation.mutate()}
      />
    </Screen>
  );
}
