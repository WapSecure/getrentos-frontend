import { router } from 'expo-router';
import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';
import { useState } from 'react';
import { View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePagedList } from '@/lib/query/usePagedList';
import { MessageCircle, ReceiptText, Repeat } from '@sureground/icons/native';
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  ListSkeleton,
  QueryState,
  Screen,
  SectionHeader,
  Text,
  useTheme,
  useToast,
  IconButton,
} from '@sureground/ui-native';
import { residentApi, type Due, type DueCategory, type DueStatus } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate, formatNaira } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { ServiceChargesEntry } from '@/components/service-charge/ServiceChargesEntry';
import { goBack } from '@/lib/goBack';
import { PaySheet } from '@/components/payments/PaySheet';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/lib/api/paymentStatus';
import { errorMessage } from '@/lib/api/client';

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<DueStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  processing: 'Payment started',
  waived: 'Waived',
};

const STATUS_TONE: Record<DueStatus, BadgeTone> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'danger',
  processing: 'warning',
  waived: 'success',
};

const CATEGORY_LABEL: Record<DueCategory, string> = {
  rent: 'Rent',
  service_charge: 'Service Charge',
  deposit: 'Deposit',
  levy: 'Levy',
};

export default function ResidentDues() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const checkout = usePaystackCheckout();
  const providers = usePaymentProviders();
  const [payDue, setPayDue] = useState<Due | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const closeSheet = () => {
    setSheetOpen(false);
    setProviderError(null);
  };

  const summary = useQuery({
    queryKey: qk.resident.duesSummary,
    queryFn: () => residentApi.getDuesSummary(),
  });
  // Unpaid comes oldest first, so an overdue charge is never behind "Show more".
  const unpaid = usePagedList([...qk.resident.dues, 'unpaid'], (page) =>
    residentApi.listDues(page, PAGE_SIZE, 'unpaid')
  );
  const settled = usePagedList([...qk.resident.dues, 'settled'], (page) =>
    residentApi.listDues(page, PAGE_SIZE, 'settled')
  );
  const refetchAll = () => {
    void summary.refetch();
    void unpaid.query.refetch();
    void settled.query.refetch();
  };

  const pay = useMutation({
    mutationFn: ({ dueId, provider }: { dueId: string; provider?: PaymentProvider }) =>
      residentApi.payDue(dueId, provider),
    onMutate: () => setProviderError(null),
    onSuccess: async (updated) => {
      closeSheet();
      // The webhook confirms payment server-side; refetch once the browser closes.
      if (updated.authorizationUrl) {
        await checkout(updated.authorizationUrl, updated.reference);
      } else if (updated.status === 'paid') {
        toast.show('Your earlier payment went through. This due is paid.', 'success');
      }
      qc.invalidateQueries({ queryKey: qk.resident.dues });
    },
    onError: (err, { provider }) => {
      const unavailable = providers.recover(err, provider);
      if (unavailable) {
        setProviderError(unavailable);
        return;
      }
      closeSheet();
      toast.show(errorMessage(err, 'Unable to start payment. Please try again.'), 'error');
    },
  });

  const startPay = (due: Due) => {
    setPayDue(due);
    setProviderError(null);
    setSheetOpen(true);
  };
  const renderDue = (due: Due) => (
    <DueCard
      key={due.id}
      due={due}
      onPay={() => startPay(due)}
      paying={pay.isPending && pay.variables?.dueId === due.id}
    />
  );
  const owed = summary.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Estate finance"
        title="Dues"
        subtitle="Charges, payments and recurring obligations"
        onBack={() => goBack()}
        accessory={
          <IconButton
            onPress={() => router.push('/(app)/estate-office-messages')}
            accessibilityLabel="Message the estate office"
            icon={<MessageCircle size={20} color={colors.primary} />}
          />
        }
      />
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <ServiceChargesEntry kind="resident" />
      </View>
      <Screen
        refreshing={unpaid.query.isRefetching || settled.query.isRefetching}
        onRefresh={refetchAll}
      >
        <QueryState
          query={unpaid.query}
          skeleton={<ListSkeleton variant="card" rows={2} height={90} />}
          isEmpty={unpaid.total === 0 && settled.total === 0 && !settled.query.isPending}
          empty={{
            icon: <ReceiptText size={34} color={colors.mutedForeground} />,
            title: 'No dues yet',
            description: "Your estate manager hasn't charged any dues to your household.",
          }}
        >
          <SectionHeader
            title="To pay"
            description={
              owed
                ? owed.outstandingCount === 0
                  ? "You're up to date."
                  : `${formatNaira(owed.outstandingTotal)} across ${owed.outstandingCount} ${owed.outstandingCount === 1 ? 'due' : 'dues'}${owed.overdueCount > 0 ? `, ${owed.overdueCount} overdue` : ''}`
                : undefined
            }
          />
          {unpaid.items.map(renderDue)}
          {unpaid.hasMore ? (
            <Button
              label="Show more"
              variant="ghost"
              loading={unpaid.isLoadingMore}
              onPress={unpaid.loadMore}
            />
          ) : null}
          {settled.items.length > 0 ? (
            <>
              <SectionHeader title="History" />
              {settled.items.map(renderDue)}
              {settled.hasMore ? (
                <Button
                  label="Show more"
                  variant="ghost"
                  loading={settled.isLoadingMore}
                  onPress={settled.loadMore}
                />
              ) : null}
            </>
          ) : null}
        </QueryState>
      </Screen>
      <PaySheet
        open={sheetOpen && !!payDue}
        onClose={closeSheet}
        title="Pay dues"
        context={
          payDue
            ? `${CATEGORY_LABEL[payDue.category]}${payDue.description ? ` · ${payDue.description}` : ''}`
            : null
        }
        dueDate={payDue?.dueDate}
        overdue={payDue?.status === 'overdue'}
        owed={payDue?.amount ?? 0}
        amount={payDue?.amount ?? 0}
        itemLabel={payDue ? CATEGORY_LABEL[payDue.category] : 'Dues'}
        receiverLine={`The fee goes to the payment company, so your estate receives the full ${formatNaira(payDue?.amount ?? 0)}.`}
        protection="Your payment goes to your estate."
        providers={providers}
        providerError={providerError}
        busy={pay.isPending}
        onPay={() => payDue && pay.mutate({ dueId: payDue.id, provider: providers.provider })}
      />
    </View>
  );
}

function DueCard({ due, onPay, paying }: { due: Due; onPay: () => void; paying: boolean }) {
  const { spacing, colors } = useTheme();
  // The API checks whether an earlier checkout went through before starting another.
  const canPay =
    due.status === 'pending' || due.status === 'overdue' || due.status === 'processing';
  // `amount` already includes any late fee.
  const totalAmount = due.amount;

  return (
    <Card elevated>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text variant="bodyStrong">{CATEGORY_LABEL[due.category]}</Text>
            {due.isRecurring ? <Repeat size={12} color={colors.mutedForeground} /> : null}
          </View>
          {due.description ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={2}>
              {due.description}
            </Text>
          ) : null}
          <Text variant="title">{formatNaira(totalAmount)}</Text>
          {due.lateFeeApplied > 0 ? (
            <Text variant="caption" color="mutedForeground">
              Includes {formatNaira(due.lateFeeApplied)} late fee
            </Text>
          ) : null}
          <Text variant="caption" color="mutedForeground">
            {due.status === 'paid' && due.paidDate
              ? `Paid ${formatDate(due.paidDate, 'short')}`
              : due.status === 'waived'
                ? 'Waived by your estate office'
                : `Due ${formatDate(due.dueDate, 'short')}`}
          </Text>
        </View>
        <Badge label={STATUS_LABEL[due.status]} tone={STATUS_TONE[due.status]} />
      </View>
      {canPay ? (
        <Button
          label={due.status === 'processing' ? 'Finish paying' : 'Pay now'}
          size="sm"
          fullWidth={false}
          loading={paying}
          onPress={onPay}
          style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
        />
      ) : null}
    </Card>
  );
}
