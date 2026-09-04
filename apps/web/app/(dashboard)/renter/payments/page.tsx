'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentsHeader } from '@/components/renter/payments/PaymentsHeader';
import { PaymentsStats } from '@/components/renter/payments/PaymentsStats';
import { PaymentsList } from '@/components/renter/payments/PaymentsList';
import { PaymentSchedule } from '@/components/renter/payments/PaymentSchedule';
import { PaymentMethods } from '@/components/renter/payments/PaymentMethods';
import { AutoPaySetup } from '@/components/renter/payments/AutoPaySetup';
import { PaymentAnalytics } from '@/components/renter/payments/PaymentAnalytics';
import { PaymentReceiptsGallery } from '@/components/renter/payments/PaymentReceiptsGallery';
import { PaymentNotifications } from '@/components/renter/payments/PaymentNotifications';
import { PaymentExport } from '@/components/renter/payments/PaymentExport';
import { DisputePaymentDialog } from '@/components/renter/payments/DisputePaymentDialog';
import { renterService, type Payment } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { PageErrorState, PageLoadingState, Pagination } from '@getrentos/ui';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [disputingPaymentId, setDisputingPaymentId] = useState<string | null>(null);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const paymentsQuery = useQuery({
    queryKey: [...renterKeys.payments, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(renterService.listPayments({ page, pageSize: PAGE_SIZE })),
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
    mutationFn: ({ paymentId, method }: { paymentId: string; method?: string }) =>
      unwrap(renterService.payNow(paymentId, method)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: renterKeys.payments });
      queryClient.invalidateQueries({ queryKey: renterKeys.receipts });
      pushNotification({
        type: 'success',
        title: 'Payment Successful',
        message: `Rent payment of ₦${updated.amount.toLocaleString()} for ${updated.propertyName} was successful.`,
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

  const handlePayNow = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;
    payNowMutation.mutate({ paymentId, method: payment.method });
  };

  const handlePayAll = () => {
    const due = payments.filter((p) => p.status !== 'paid');
    due.forEach((payment) => {
      payNowMutation.mutate({ paymentId: payment.id, method: payment.method });
    });
  };

  const handleDownloadReceipt = (receiptId: string) => {
    const receipt = receipts.find((r) => r.id === receiptId || r.paymentId === receiptId);
    if (!receipt?.url) {
      pushNotification({
        type: 'error',
        title: 'Receipt Unavailable',
        message: 'This receipt file is not available yet. Please try again later.',
      });
      return;
    }
    window.open(receipt.url, '_blank', 'noopener,noreferrer');
    pushNotification({
      type: 'info',
      title: 'Receipt Opened',
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
        title: 'Dispute Submitted',
        message: `Your dispute for ${updated.propertyName} has been submitted for review: "${reason}"`,
      });
    },
  });

  const handleSubmitDispute = async (reason: string) => {
    if (!disputingPaymentId) return;
    await disputeMutation.mutateAsync({ paymentId: disputingPaymentId, reason });
    setDisputingPaymentId(null);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const invalidatePaymentMethods = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.paymentMethods });

  const setDefaultPaymentMethodMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.setDefaultPaymentMethod(id)),
    onSuccess: invalidatePaymentMethods,
  });

  const removePaymentMethodMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.removePaymentMethod(id)),
    onSuccess: invalidatePaymentMethods,
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: (data: { last4: string; expiry: string }) =>
      unwrap(
        renterService.addPaymentMethod({
          type: 'card',
          name: `Card ending ${data.last4}`,
          last4: data.last4,
          expiry: data.expiry,
        })
      ),
    onSuccess: invalidatePaymentMethods,
  });

  const handleSetDefaultPaymentMethod = async (id: string) => {
    await setDefaultPaymentMethodMutation.mutateAsync(id);
  };
  const handleRemovePaymentMethod = async (id: string) => {
    await removePaymentMethodMutation.mutateAsync(id);
  };
  const handleAddPaymentMethod = async (data: { last4: string; expiry: string }) => {
    await addPaymentMethodMutation.mutateAsync(data);
  };

  const paymentQueries = [paymentsQuery, receiptsQuery, paymentMethodsQuery];
  if (paymentQueries.some((query) => query.isLoading)) {
    return <PageLoadingState />;
  }

  if (paymentQueries.some((query) => query.isError)) {
    return (
      <PageErrorState
        title="Payment information is unavailable"
        description="We could not load your payments, receipts, or payment methods. No payment has been attempted."
        onRetry={() => paymentQueries.forEach((query) => void query.refetch())}
        isRetrying={paymentQueries.some((query) => query.isFetching)}
      />
    );
  }

  return (
    <>
      <PaymentsHeader onExport={() => setShowExportModal(true)} />
      <PaymentsStats payments={payments} />

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <PaymentsList
            payments={payments}
            onPayNow={handlePayNow}
            onDownloadReceipt={handleDownloadReceipt}
            onDispute={handleDispute}
          />
          <PaymentReceiptsGallery receipts={receipts} onDownload={handleDownloadReceipt} />
        </div>
        <div className="space-y-6">
          <PaymentNotifications
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationAsRead}
            onClearAll={handleClearAllNotifications}
          />
          <PaymentSchedule payments={payments} onPayAll={handlePayAll} />
          <PaymentMethods
            methods={paymentMethods}
            onSetDefault={handleSetDefaultPaymentMethod}
            onRemove={handleRemovePaymentMethod}
            onAdd={handleAddPaymentMethod}
          />
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
