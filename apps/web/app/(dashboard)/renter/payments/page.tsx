'use client';

import { useState, useEffect } from 'react';
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
import {
  renterService,
  type Payment,
  type Receipt,
  type PaymentMethod as PaymentMethodModel,
} from '@/services/renterService';

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
  const [payments, setPayments] = useState<DisplayPayment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodModel[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [disputingPaymentId, setDisputingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    const loadPayments = async () => {
      const [paymentsRes, receiptsRes, methodsRes] = await Promise.all([
        renterService.listPayments(),
        renterService.listReceipts(),
        renterService.listPaymentMethods(),
      ]);
      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data.map((p) => ({ ...p, method: p.method ?? 'card' })));
      }
      if (receiptsRes.success && receiptsRes.data) setReceipts(receiptsRes.data);
      if (methodsRes.success && methodsRes.data) setPaymentMethods(methodsRes.data);
    };
    loadPayments();
  }, []);

  const pushNotification = (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    setNotifications((prev) => [
      { ...notification, id: `notif_${Date.now()}`, date: new Date().toISOString(), read: false },
      ...prev,
    ]);
  };

  const handlePayNow = async (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: 'processing' } : p))
    );

    const res = await renterService.payNow(paymentId, payment.method ?? 'card');
    if (res.success && res.data) {
      const updated: DisplayPayment = { ...res.data, method: res.data.method ?? 'card' };
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? updated : p)));
      const receiptsRes = await renterService.listReceipts();
      if (receiptsRes.success && receiptsRes.data) setReceipts(receiptsRes.data);
      pushNotification({
        type: 'success',
        title: 'Payment Successful',
        message: `Rent payment of ₦${payment.amount.toLocaleString()} for ${payment.propertyName} was successful.`,
      });
    } else {
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? payment : p)));
    }
  };

  const handleDownloadReceipt = (receiptId: string) => {
    const receipt = receipts.find((r) => r.id === receiptId || r.paymentId === receiptId);
    pushNotification({
      type: 'info',
      title: 'Receipt Downloaded',
      message: receipt
        ? `${receipt.fileName} has been downloaded.`
        : 'Your receipt has been downloaded.',
    });
  };

  const handleViewReceipt = (receiptId: string) => {
    console.log('View receipt:', receiptId);
  };

  const handleDispute = (paymentId: string) => {
    setDisputingPaymentId(paymentId);
  };

  const handleSubmitDispute = async (reason: string) => {
    if (!disputingPaymentId) return;
    const payment = payments.find((p) => p.id === disputingPaymentId);
    const res = await renterService.disputePayment(disputingPaymentId, reason);
    if (res.success && res.data) {
      const updated: DisplayPayment = { ...res.data, method: res.data.method ?? 'card' };
      setPayments((prev) => prev.map((p) => (p.id === disputingPaymentId ? updated : p)));
      pushNotification({
        type: 'info',
        title: 'Dispute Submitted',
        message: `Your dispute for ${payment?.propertyName ?? 'this payment'} has been submitted for review: "${reason}"`,
      });
    }
    setDisputingPaymentId(null);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    const res = await renterService.setDefaultPaymentMethod(id);
    if (res.success && res.data) setPaymentMethods(res.data);
  };

  const handleRemovePaymentMethod = async (id: string) => {
    const res = await renterService.removePaymentMethod(id);
    if (res.success) setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddPaymentMethod = async (data: { last4: string; expiry: string }) => {
    const res = await renterService.addPaymentMethod({
      type: 'card',
      name: `Card ending ${data.last4}`,
      last4: data.last4,
      expiry: data.expiry,
    });
    if (res.success && res.data) {
      const created = res.data;
      setPaymentMethods((prev) => [...prev, created]);
    }
  };

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
          <PaymentReceiptsGallery
            receipts={receipts}
            onDownload={handleDownloadReceipt}
            onView={handleViewReceipt}
          />
        </div>
        <div className="space-y-6">
          <PaymentNotifications
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationAsRead}
            onClearAll={handleClearAllNotifications}
          />
          <PaymentSchedule payments={payments} />
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
    </>
  );
}
