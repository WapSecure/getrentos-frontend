'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RenterNavbar } from '@/components/renter/navigation/RenterNavbar';
import { RenterSidebar } from '@/components/renter/dashboard/RenterSidebar';
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
import { ROUTES, isAuthenticated, STORAGE_KEYS } from '@/lib/constants/auth';

interface Payment {
  id: string;
  propertyId: string;
  propertyName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  method: 'card' | 'bank_transfer' | 'wallet';
  receiptUrl?: string;
  description: string;
  dueDate: string;
  escrowStatus: 'held' | 'released' | 'pending';
}

interface Receipt {
  id: string;
  paymentId: string;
  propertyName: string;
  amount: number;
  date: string;
  fileName: string;
  url: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  const loadPayments = () => {
    const mockPayments: Payment[] = [
      {
        id: 'pay_001',
        propertyId: 'prop_001',
        propertyName: 'Modern Downtown Loft',
        amount: 200000,
        date: '2024-06-01',
        status: 'paid',
        method: 'card',
        receiptUrl: '#',
        description: 'Rent payment for June 2024',
        dueDate: '2024-06-01',
        escrowStatus: 'released',
      },
      {
        id: 'pay_002',
        propertyId: 'prop_001',
        propertyName: 'Modern Downtown Loft',
        amount: 200000,
        date: '2024-05-01',
        status: 'paid',
        method: 'bank_transfer',
        receiptUrl: '#',
        description: 'Rent payment for May 2024',
        dueDate: '2024-05-01',
        escrowStatus: 'released',
      },
      {
        id: 'pay_003',
        propertyId: 'prop_001',
        propertyName: 'Modern Downtown Loft',
        amount: 200000,
        date: '2024-06-25',
        status: 'pending',
        method: 'card',
        receiptUrl: '#',
        description: 'Rent payment for July 2024',
        dueDate: '2024-07-01',
        escrowStatus: 'held',
      },
      {
        id: 'pay_004',
        propertyId: 'prop_002',
        propertyName: 'Cozy Studio Apartment',
        amount: 150000,
        date: '2024-06-15',
        status: 'overdue',
        method: 'bank_transfer',
        receiptUrl: '#',
        description: 'Rent payment for June 2024',
        dueDate: '2024-06-01',
        escrowStatus: 'held',
      },
      {
        id: 'pay_005',
        propertyId: 'prop_003',
        propertyName: 'Luxury Beachfront Villa',
        amount: 800000,
        date: '2024-05-15',
        status: 'paid',
        method: 'wallet',
        receiptUrl: '#',
        description: 'Rent payment for May 2024',
        dueDate: '2024-05-01',
        escrowStatus: 'released',
      },
      {
        id: 'pay_006',
        propertyId: 'prop_001',
        propertyName: 'Modern Downtown Loft',
        amount: 200000,
        date: '2024-07-01',
        status: 'processing',
        method: 'card',
        receiptUrl: '#',
        description: 'Rent payment for July 2024',
        dueDate: '2024-07-01',
        escrowStatus: 'held',
      },
    ];
    setPayments(mockPayments);

    // Generate receipts from paid payments
    const mockReceipts: Receipt[] = mockPayments
      .filter((p) => p.status === 'paid')
      .map((p) => ({
        id: `rec_${p.id}`,
        paymentId: p.id,
        propertyName: p.propertyName,
        amount: p.amount,
        date: p.date,
        fileName: `Rent_Receipt_${p.propertyName}_${p.date}.pdf`,
        url: '#',
      }));
    setReceipts(mockReceipts);

    // Generate notifications
    const mockNotifications: Notification[] = [
      {
        id: 'notif_001',
        type: 'success',
        title: 'Payment Successful',
        message: 'Rent payment of ₦200,000 for Modern Downtown Loft was successful.',
        date: '2024-06-01T10:30:00',
        read: false,
      },
      {
        id: 'notif_002',
        type: 'warning',
        title: 'Payment Reminder',
        message: 'Rent payment of ₦150,000 for Cozy Studio Apartment is due in 3 days.',
        date: '2024-05-29T08:00:00',
        read: false,
      },
      {
        id: 'notif_003',
        type: 'info',
        title: 'Receipt Available',
        message: 'Download your rent receipt for May 2024 payment.',
        date: '2024-05-15T14:20:00',
        read: true,
      },
    ];
    setNotifications(mockNotifications);
  };

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      loadPayments();
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handlePayNow = (paymentId: string) => {
    console.log('Pay now:', paymentId);
  };

  const handleDownloadReceipt = (receiptId: string) => {
    console.log('Download receipt:', receiptId);
  };

  const handleViewReceipt = (receiptId: string) => {
    console.log('View receipt:', receiptId);
  };

  const handleDispute = (paymentId: string) => {
    console.log('Dispute payment:', paymentId);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <RenterNavbar user={user} />

      <div className="flex">
        <RenterSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
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
                <PaymentMethods />
                <AutoPaySetup />
                <PaymentAnalytics payments={payments} />
              </div>
            </div>
          </div>
        </main>
      </div>

      <PaymentExport
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        payments={payments}
      />
    </div>
  );
}
