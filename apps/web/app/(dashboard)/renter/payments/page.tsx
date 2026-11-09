'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentsHeader } from '@/components/renter/payments/PaymentsHeader';
import { PaymentsSummary } from '@/components/renter/payments/PaymentsSummary';
import { PaymentsList, type PaymentStatusFilter } from '@/components/renter/payments/PaymentsList';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PaymentMethods } from '@/components/renter/payments/PaymentMethods';
import { PayAmountDialog } from '@/components/renter/payments/PayAmountDialog';
import { RentAccountCard } from '@/components/renter/payments/RentAccountCard';
import { PaymentReceiptsGallery } from '@/components/renter/payments/PaymentReceiptsGallery';
import { PaymentExport } from '@/components/renter/payments/PaymentExport';
import { DisputePaymentDialog } from '@/components/renter/payments/DisputePaymentDialog';
import { leftToPay } from '@/components/renter/payments/PaymentCard';
import { CreditCard, FileText, Wallet, Zap } from '@sureground/icons';
import { renterService, type Payment } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/format';
import {
  ConfirmDialog,
  PageErrorState,
  PageLoadingState,
  Pagination,
  useToast,
} from '@sureground/ui';
import { FinancingView } from '@/components/renter/financing/FinancingView';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/types/payments';
import { HubTabs, useHubTab, type HubTab } from '@/components/shared/navigation/HubTabs';

const TABS: HubTab[] = [
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'receipts', label: 'Receipts', icon: FileText },
  { id: 'account', label: 'Rent account', icon: Wallet },
  { id: 'financing', label: 'Flex financing', icon: Zap },
];

const PAGE_SIZE = 10;
const RECEIPTS_PAGE_SIZE = 12;
// The API's largest page size.
const MAX_PAGE_SIZE = 100;

function redirectToCheckout(url: string) {
  window.location.href = url;
}

async function fetchAllPayments(): Promise<Payment[]> {
  const all: Payment[] = [];
  for (let page = 1; ; page++) {
    const result = await unwrap(renterService.listPayments({ page, pageSize: MAX_PAGE_SIZE }));
    all.push(...result.items);
    if (result.items.length === 0 || all.length >= result.total) return all;
  }
}

interface Notice {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setTab] = useHubTab(
    'payments',
    TABS.map((tab) => tab.id)
  );
  const toast = useToast();
  const [showExportModal, setShowExportModal] = useState(false);
  const [disputingPaymentId, setDisputingPaymentId] = useState<string | null>(null);
  const [confirmingMoveInId, setConfirmingMoveInId] = useState<string | null>(null);
  const [payingPaymentId, setPayingPaymentId] = useState<string | null>(null);
  const providers = usePaymentProviders();
  const [providerError, setProviderError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [receiptsPage, setReceiptsPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatusFilter>('all');
  const search = useDebouncedValue(searchTerm.trim());
  const listFilters = {
    status: filterStatus === 'all' ? undefined : filterStatus,
    search: search || undefined,
  };
  const paymentsQuery = useQuery({
    queryKey: [...renterKeys.payments, { page, pageSize: PAGE_SIZE, ...listFilters }],
    queryFn: () =>
      unwrap(renterService.listPayments({ page, pageSize: PAGE_SIZE, ...listFilters })),
    placeholderData: keepPreviousData,
  });
  // Checkout takes one charge at a time, never a combined total.
  const openChargesQuery = useQuery({
    queryKey: [...renterKeys.payments, { page: 1, pageSize: MAX_PAGE_SIZE, open: true }],
    queryFn: () =>
      unwrap(renterService.listPayments({ page: 1, pageSize: MAX_PAGE_SIZE, open: true })),
  });
  const receiptsQuery = useQuery({
    queryKey: [...renterKeys.receipts, { page: receiptsPage, pageSize: RECEIPTS_PAGE_SIZE }],
    queryFn: () =>
      unwrap(renterService.listReceipts({ page: receiptsPage, pageSize: RECEIPTS_PAGE_SIZE })),
    placeholderData: keepPreviousData,
    enabled: activeTab === 'receipts',
  });
  const paymentMethodsQuery = useQuery({
    queryKey: renterKeys.paymentMethods,
    queryFn: () => unwrap(renterService.listPaymentMethods()),
    enabled: activeTab === 'account',
  });
  const exportQuery = useQuery({
    queryKey: [...renterKeys.payments, 'export'],
    queryFn: fetchAllPayments,
    enabled: showExportModal,
  });

  const paymentMethods = paymentMethodsQuery.data ?? [];
  const rawPayments = paymentsQuery.data?.items ?? [];
  const receipts = receiptsQuery.data?.items ?? [];
  const total = paymentsQuery.data?.total ?? 0;
  const openCharges = openChargesQuery.data?.items ?? [];
  const openCount = openChargesQuery.data?.total ?? 0;
  const nextCharge = openCharges[0] ?? null;
  const summary = paymentsQuery.data?.summary ?? openChargesQuery.data?.summary;

  const pushNotification = ({ type, title, message }: Notice) =>
    toast.show(`${title}. ${message}`, type);

  const payNowMutation = useMutation({
    mutationFn: ({
      paymentId,
      method,
      amount,
      provider,
    }: {
      paymentId: string;
      method?: string;
      amount?: number;
      provider?: PaymentProvider;
    }) => unwrap(renterService.payNow(paymentId, method, amount, provider)),
    onSuccess: (updated) => {
      if (updated.authorizationUrl) {
        // The payment stays PROCESSING until checkout completes, so redirect rather than claim success.
        redirectToCheckout(updated.authorizationUrl);
        return;
      }
      setPayingPaymentId(null);
      queryClient.invalidateQueries({ queryKey: renterKeys.payments });
      queryClient.invalidateQueries({ queryKey: renterKeys.receipts });
      queryClient.invalidateQueries({ queryKey: ['renter', 'rent-accounts'] });
      const left = updated.outstanding ?? 0;
      if (updated.status === 'paid') {
        toast.success(updated.reference ? `Paid. Reference ${updated.reference}` : 'Paid.');
      } else if (updated.status === 'processing') {
        toast.info(
          `Your payment for ${updated.propertyName} is being confirmed. It shows as Processing until it clears.`
        );
      } else if ((updated.amountPaid ?? 0) > 0) {
        toast.success(
          `Part-payment received for ${updated.propertyName}. ${formatCurrency(left)} is still owed on this charge.`
        );
      } else {
        toast.info(`${updated.propertyName}: this charge is not paid yet.`);
      }
    },
    onError: (error: Error, variables) => {
      const unavailable = providers.recover(error, variables.provider);
      if (unavailable) {
        setProviderError(unavailable);
        return;
      }
      // Anything else shows in the pay dialog, which stays open.
    },
  });

  const payments: Payment[] = rawPayments.map((p) =>
    payNowMutation.isPending && payNowMutation.variables?.paymentId === p.id
      ? { ...p, status: 'processing' }
      : p
  );

  const owedOn = leftToPay;

  const findPayment = (paymentId: string | null): Payment | null =>
    payments.find((p) => p.id === paymentId) ?? openCharges.find((p) => p.id === paymentId) ?? null;

  const handlePayNow = (paymentId: string) => {
    setPayingPaymentId(paymentId);
  };

  const payChosen = (paymentId: string, amount: number | undefined) => {
    const payment = findPayment(paymentId);
    if (!payment) return;
    setProviderError(null);
    // With a gateway the API returns a checkout; when simulated it settles the charge and returns none.
    payNowMutation.mutate({
      paymentId,
      method: payment.method ?? 'card',
      amount,
      provider: providers.provider,
    });
  };
  const payingPayment = findPayment(payingPaymentId);

  const handleDownloadReceipt = (receiptId: string) => {
    const receipt = receipts.find((r) => r.id === receiptId || r.paymentId === receiptId);
    const url = receipt?.url || payments.find((p) => p.id === receiptId)?.receiptUrl;
    if (!url) {
      pushNotification({
        type: 'error',
        title: 'Receipt unavailable',
        message: 'This receipt file is not available yet. Please try again later.',
      });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    pushNotification({
      type: 'info',
      title: 'Receipt opened',
      message: 'Your receipt opened in a new tab, where you can save or print it.',
    });
  };

  const handleDispute = (paymentId: string) => {
    setDisputingPaymentId(paymentId);
  };

  const disputeMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      unwrap(renterService.disputePayment(paymentId, reason)),
    onSuccess: (updated, { reason }) => {
      queryClient.invalidateQueries({ queryKey: renterKeys.payments });
      pushNotification({
        type: 'info',
        title: 'Problem reported',
        message: `Your report for ${updated.propertyName} has been submitted for review: "${reason}"`,
      });
    },
    onError: (error: Error) => {
      pushNotification({
        type: 'error',
        title: 'Report not submitted',
        message: error.message || 'We could not submit your report. Please try again.',
      });
    },
  });

  const handleSubmitDispute = async (reason: string) => {
    if (!disputingPaymentId) return;
    await disputeMutation.mutateAsync({ paymentId: disputingPaymentId, reason });
    setDisputingPaymentId(null);
  };

  const handleConfirmMoveIn = (paymentId: string) => {
    setConfirmingMoveInId(paymentId);
  };

  const confirmMoveInMutation = useMutation({
    mutationFn: (paymentId: string) => unwrap(renterService.confirmMoveIn(paymentId)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: renterKeys.payments });
      queryClient.invalidateQueries({ queryKey: ['renter', 'rent-accounts'] });
      pushNotification({
        type: 'success',
        title: 'Move-in confirmed',
        message: `Your rent for ${updated.propertyName} has been released to your landlord.`,
      });
    },
    onError: (error: Error) => {
      pushNotification({
        type: 'error',
        title: 'Rent not released',
        message: error.message || 'We could not release this payment. Please try again.',
      });
    },
  });

  const confirmingMoveInPayment = payments.find((p) => p.id === confirmingMoveInId) ?? null;

  const invalidatePaymentMethods = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.paymentMethods });

  const removePaymentMethodMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.removePaymentMethod(id)),
    onSuccess: invalidatePaymentMethods,
    onError: (error: Error) =>
      pushNotification({
        type: 'error',
        title: 'Payment method not removed',
        message: error.message || 'We could not remove this payment method. Please try again.',
      }),
  });

  const handleRemovePaymentMethod = async (id: string) => {
    removePaymentMethodMutation.mutate(id);
  };

  const tabNav = <HubTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />;

  if (activeTab === 'financing') {
    return (
      <>
        {tabNav}
        <FinancingView />
      </>
    );
  }

  const header = (
    <PaymentsHeader
      onExport={activeTab === 'payments' ? () => setShowExportModal(true) : undefined}
    />
  );

  const tabQueries =
    activeTab === 'receipts'
      ? [receiptsQuery]
      : activeTab === 'account'
        ? [paymentMethodsQuery]
        : [paymentsQuery, openChargesQuery];
  if (tabQueries.some((query) => query.isLoading)) {
    return (
      <>
        {tabNav}
        {header}
        <PageLoadingState />
      </>
    );
  }

  if (tabQueries.some((query) => query.isError && !query.data)) {
    return (
      <>
        {tabNav}
        {header}
        <PageErrorState
          title="Payment information is unavailable"
          description="We could not load this part of your payments. No payment has been attempted."
          onRetry={() => tabQueries.forEach((query) => void query.refetch())}
          isRetrying={tabQueries.some((query) => query.isFetching)}
        />
      </>
    );
  }

  if (activeTab === 'receipts') {
    const receiptsTotal = receiptsQuery.data?.total ?? 0;
    return (
      <>
        {tabNav}
        {header}
        <PaymentReceiptsGallery
          receipts={receipts}
          total={receiptsTotal}
          onDownload={handleDownloadReceipt}
        />
        {receiptsTotal > RECEIPTS_PAGE_SIZE && (
          <Pagination
            page={receiptsPage}
            pageSize={RECEIPTS_PAGE_SIZE}
            total={receiptsTotal}
            onPageChange={setReceiptsPage}
            className="mt-6"
          />
        )}
      </>
    );
  }

  if (activeTab === 'account') {
    return (
      <>
        {tabNav}
        {header}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <PaymentMethods methods={paymentMethods} onRemove={handleRemovePaymentMethod} />
          <RentAccountCard />
        </div>
      </>
    );
  }

  return (
    <>
      {tabNav}
      {header}
      <PaymentsSummary
        openCharges={openCharges}
        openCount={openCount}
        summary={summary}
        onPay={() => nextCharge && setPayingPaymentId(nextCharge.id)}
        isPaying={payNowMutation.isPending}
      />

      <PaymentsList
        payments={payments}
        total={total}
        onPayNow={handlePayNow}
        onDownloadReceipt={handleDownloadReceipt}
        onDispute={handleDispute}
        onConfirmMoveIn={handleConfirmMoveIn}
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        filterStatus={filterStatus}
        onFilterChange={(value) => {
          setFilterStatus(value);
          setPage(1);
        }}
        serverFiltered={!!paymentsQuery.data?.summary}
      />

      {total > PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <PaymentExport
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        payments={exportQuery.data ?? []}
        isLoading={exportQuery.isLoading}
        error={exportQuery.isError ? exportQuery.error.message || 'Please try again.' : null}
      />

      <DisputePaymentDialog
        open={!!disputingPaymentId}
        onOpenChange={(open) => !open && setDisputingPaymentId(null)}
        onSubmit={handleSubmitDispute}
      />
      <ConfirmDialog
        open={!!confirmingMoveInId}
        onOpenChange={(open) => !open && setConfirmingMoveInId(null)}
        title="Confirm move-in?"
        description={
          confirmingMoveInPayment
            ? `This releases the ${
                confirmingMoveInPayment.heldAmountNaira
                  ? `${formatCurrency(confirmingMoveInPayment.heldAmountNaira)} `
                  : ''
              }rent Sureground is holding for ${confirmingMoveInPayment.propertyName} to your landlord now. Only confirm once you've moved in — it can't be undone.`
            : ''
        }
        confirmLabel="Yes, release to landlord"
        onConfirm={() => {
          if (confirmingMoveInId) confirmMoveInMutation.mutate(confirmingMoveInId);
          setConfirmingMoveInId(null);
        }}
      />
      <PayAmountDialog
        payment={
          payingPayment
            ? {
                propertyName: payingPayment.propertyName,
                owed: owedOn(payingPayment),
                dueDate: payingPayment.dueDate ?? null,
                overdue: payingPayment.status === 'overdue',
              }
            : null
        }
        onClose={() => {
          setPayingPaymentId(null);
          setProviderError(null);
          payNowMutation.reset();
        }}
        onPay={(amount) => payingPaymentId && payChosen(payingPaymentId, amount)}
        providers={providers}
        providerError={providerError}
        busy={payNowMutation.isPending}
        error={
          payNowMutation.isError && !providerError
            ? payNowMutation.error.message || 'We could not start this payment. Please try again.'
            : null
        }
      />
    </>
  );
}
