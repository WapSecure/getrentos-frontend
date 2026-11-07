'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentsHeader } from '@/components/renter/payments/PaymentsHeader';
import { PaymentsStats } from '@/components/renter/payments/PaymentsStats';
import { PaymentsList } from '@/components/renter/payments/PaymentsList';
import { PaymentSchedule } from '@/components/renter/payments/PaymentSchedule';
import { PaymentMethods } from '@/components/renter/payments/PaymentMethods';
import { AutoPaySetup } from '@/components/renter/payments/AutoPaySetup';
import { PayAmountDialog } from '@/components/renter/payments/PayAmountDialog';
import { RentAccountCard } from '@/components/renter/payments/RentAccountCard';
import { PaymentAnalytics } from '@/components/renter/payments/PaymentAnalytics';
import { PaymentReceiptsGallery } from '@/components/renter/payments/PaymentReceiptsGallery';
import { PaymentNotifications } from '@/components/renter/payments/PaymentNotifications';
import { PaymentExport } from '@/components/renter/payments/PaymentExport';
import { DisputePaymentDialog } from '@/components/renter/payments/DisputePaymentDialog';
import { CreditCard, Zap } from 'lucide-react';
import { renterService, type Payment } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { ConfirmDialog, PageErrorState, PageLoadingState, Pagination } from '@getrentos/ui';
import { FinancingView } from '@/components/renter/financing/FinancingView';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/types/payments';
import { HubTabs, useHubTab, type HubTab } from '@/components/shared/navigation/HubTabs';

const TABS: HubTab[] = [
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'financing', label: 'Flex financing', icon: Zap },
];

/** Real gateway checkout redirect: pulled out of component scope so it reads as an
 *  ordinary side effect rather than a render-path mutation. */
function redirectToCheckout(url: string) {
  window.location.href = url;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

type DisplayPayment = Omit<Payment, 'method'> & { method: 'card' | 'bank_transfer' | 'wallet' };

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setTab] = useHubTab('payments', ['payments', 'financing']);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [disputingPaymentId, setDisputingPaymentId] = useState<string | null>(null);
  const [confirmingMoveInId, setConfirmingMoveInId] = useState<string | null>(null);
  const [payingPaymentId, setPayingPaymentId] = useState<string | null>(null);
  // Which company takes the payment, and why the last one could not.
  const providers = usePaymentProviders();
  const [providerError, setProviderError] = useState<string | null>(null);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const paymentsQuery = useQuery({
    queryKey: [...renterKeys.payments, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(renterService.listPayments({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  // The oldest open charge across every page (the API sorts open charges by due
  // date), and how many are open. Checkout takes one charge at a time, so the
  // renter pays the oldest first through the pay dialog, never a combined total.
  const nextChargeQuery = useQuery({
    queryKey: [...renterKeys.payments, { page: 1, pageSize: 1, open: true }],
    queryFn: () => unwrap(renterService.listPayments({ page: 1, pageSize: 1, open: true })),
  });
  const receiptsQuery = useQuery({
    queryKey: [...renterKeys.receipts, { page: 1, pageSize: 12 }],
    queryFn: () => unwrap(renterService.listReceipts({ page: 1, pageSize: 12 })),
  });
  const paymentMethodsQuery = useQuery({
    queryKey: renterKeys.paymentMethods,
    queryFn: () => unwrap(renterService.listPaymentMethods()),
  });
  const rawPaymentsData = paymentsQuery.data;
  const receiptsData = receiptsQuery.data;
  const paymentMethods = paymentMethodsQuery.data ?? [];
  const rawPayments = rawPaymentsData?.items ?? [];
  const receipts = receiptsData?.items ?? [];
  const total = rawPaymentsData?.total ?? 0;

  const pushNotification = (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    setNotifications((prev) => [
      { ...notification, id: `notif_${Date.now()}`, date: new Date().toISOString(), read: false },
      ...prev,
    ]);
  };

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
        // Real gateway flow: the payment is PROCESSING until checkout
        // completes, so redirect instead of claiming success.
        redirectToCheckout(updated.authorizationUrl);
        return;
      }
      queryClient.invalidateQueries({ queryKey: renterKeys.payments });
      queryClient.invalidateQueries({ queryKey: renterKeys.receipts });
      queryClient.invalidateQueries({ queryKey: ['renter', 'rent-accounts'] });
      const left = updated.outstanding ?? 0;
      pushNotification({
        type: 'success',
        title: 'Payment successful',
        message:
          left > 0
            ? `Payment received for ${updated.propertyName}. ₦${left.toLocaleString()} is still owed on this charge.`
            : `Rent for ${updated.propertyName} is paid in full.`,
      });
    },
    onError: (error: Error, variables) => {
      // That company cannot take it right now: reopen the choice with the other one picked.
      const unavailable = providers.recover(error, variables.provider);
      if (unavailable) {
        setProviderError(unavailable);
        setPayingPaymentId(variables.paymentId);
        return;
      }
      pushNotification({
        type: 'error',
        title: 'Payment unsuccessful',
        message: error.message || 'We could not process this payment. Please try again.',
      });
    },
  });

  const payments: DisplayPayment[] = rawPayments.map((p) => {
    const method = p.method ?? 'card';
    if (payNowMutation.isPending && payNowMutation.variables?.paymentId === p.id) {
      return { ...p, method, status: 'processing' };
    }
    return { ...p, method };
  });

  const owedOn = (p: { amount: number; amountPaid?: number }) => p.amount - (p.amountPaid ?? 0);

  const nextCharge = nextChargeQuery.data?.items[0] ?? null;
  const openCount = nextChargeQuery.data?.total ?? 0;
  // A charge on this page, or the oldest open one (which may be on another page).
  const findPayment = (paymentId: string | null): DisplayPayment | null => {
    const onPage = payments.find((p) => p.id === paymentId);
    if (onPage) return onPage;
    return nextCharge && nextCharge.id === paymentId
      ? { ...nextCharge, method: nextCharge.method ?? 'card' }
      : null;
  };

  // Paying opens a choice of paying in full or in part.
  const handlePayNow = (paymentId: string) => {
    setPayingPaymentId(paymentId);
  };
  // Open charges are paid one at a time, oldest first.
  const handlePayOldest = nextCharge ? () => setPayingPaymentId(nextCharge.id) : undefined;

  const payChosen = (paymentId: string, amount: number | undefined) => {
    const payment = findPayment(paymentId);
    if (!payment) return;
    // The API decides: with a gateway it returns a checkout to redirect to;
    // when payments are simulated it settles the charge itself and returns none.
    payNowMutation.mutate({
      paymentId,
      method: payment.method,
      amount,
      provider: providers.provider,
    });
  };
  const payingPayment = findPayment(payingPaymentId);

  const handleDownloadReceipt = (receiptId: string) => {
    const receipt = receipts.find((r) => r.id === receiptId || r.paymentId === receiptId);
    if (!receipt?.url) {
      pushNotification({
        type: 'error',
        title: 'Receipt unavailable',
        message: 'This receipt file is not available yet. Please try again later.',
      });
      return;
    }
    window.open(receipt.url, '_blank', 'noopener,noreferrer');
    pushNotification({
      type: 'info',
      title: 'Receipt opened',
      message: `${receipt.fileName} opened in a new tab, where you can save or print it.`,
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
        title: 'Dispute submitted',
        message: `Your dispute for ${updated.propertyName} has been submitted for review: "${reason}"`,
      });
    },
    onError: (error: Error) => {
      pushNotification({
        type: 'error',
        title: 'Dispute not submitted',
        message: error.message || 'We could not submit this dispute. Please try again.',
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

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const invalidatePaymentMethods = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.paymentMethods });

  const notifyPaymentMethodError = (title: string, fallback: string) => (error: Error) =>
    pushNotification({ type: 'error', title, message: error.message || fallback });

  const removePaymentMethodMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.removePaymentMethod(id)),
    onSuccess: invalidatePaymentMethods,
    onError: notifyPaymentMethodError(
      'Payment method not removed',
      'We could not remove this payment method. Please try again.'
    ),
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

  const paymentQueries = [paymentsQuery, receiptsQuery, paymentMethodsQuery];
  if (paymentQueries.some((query) => query.isLoading)) {
    return (
      <>
        {tabNav}
        <PageLoadingState />
      </>
    );
  }

  if (paymentQueries.some((query) => query.isError && !query.data)) {
    return (
      <>
        {tabNav}
        <PageErrorState
          title="Payment information is unavailable"
          description="We could not load your payments, receipts, or payment methods. No payment has been attempted."
          onRetry={() => paymentQueries.forEach((query) => void query.refetch())}
          isRetrying={paymentQueries.some((query) => query.isFetching)}
        />
      </>
    );
  }

  return (
    <>
      {tabNav}
      <PaymentsHeader
        onExport={() => setShowExportModal(true)}
        onPayOldest={handlePayOldest}
        notifications={
          <PaymentNotifications
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationAsRead}
            onClearAll={handleClearAllNotifications}
          />
        }
      />
      <PaymentsStats payments={payments} />

      <div className="mt-7 grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-6 xl:col-span-8">
          <PaymentsList
            payments={payments}
            onPayNow={handlePayNow}
            onDownloadReceipt={handleDownloadReceipt}
            onDispute={handleDispute}
            onConfirmMoveIn={handleConfirmMoveIn}
          />
          <PaymentReceiptsGallery receipts={receipts} onDownload={handleDownloadReceipt} />
        </div>
        <div className="min-w-0 space-y-6 xl:col-span-4">
          <PaymentSchedule
            payments={payments}
            onPayOldest={handlePayOldest}
            openCount={openCount}
            isPaying={payNowMutation.isPending}
          />
          <PaymentMethods methods={paymentMethods} onRemove={handleRemovePaymentMethod} />
          <RentAccountCard />
          <AutoPaySetup />
          <PaymentAnalytics payments={payments} />
        </div>
      </div>

      <PaymentExport
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        payments={payments}
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
            ? `This releases ₦${confirmingMoveInPayment.amount.toLocaleString()} for ${confirmingMoveInPayment.propertyName} to your landlord now. Only confirm once you've moved in — it can't be undone.`
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
        }}
        onPay={(amount) => payingPaymentId && payChosen(payingPaymentId, amount)}
        providers={providers}
        providerError={providerError}
      />

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </>
  );
}
