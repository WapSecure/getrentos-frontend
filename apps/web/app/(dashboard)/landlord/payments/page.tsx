'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { LandlordSidebar } from '@/components/landlord/dashboard/LandlordSidebar';
import { RentCollectionStats } from '@/components/landlord/payments/RentCollectionStats';
import { PaymentsTable } from '@/components/landlord/payments/PaymentsTable';
import { PaymentDetailsModal } from '@/components/landlord/payments/PaymentDetailsModal';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { RentPayment, RentPaymentStatus } from '@/types/landlord';

const mockPayments: RentPayment[] = [
  {
    id: 'pay_001',
    tenantId: 'tenant_001',
    tenantName: 'Adaeze Okafor',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitId: 'unit_001',
    unitName: 'Unit 1A',
    amount: 450_000,
    dueDate: '2026-08-01',
    paidDate: '2026-07-30',
    status: 'paid',
    escrowStatus: 'released',
    releaseDate: '2026-08-02',
  },
  {
    id: 'pay_002',
    tenantId: 'tenant_002',
    tenantName: 'Tunde Bakare',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitId: 'unit_002',
    unitName: 'Unit 2B',
    amount: 320_000,
    dueDate: '2026-08-10',
    status: 'pending',
    escrowStatus: 'held',
  },
  {
    id: 'pay_003',
    tenantId: 'tenant_003',
    tenantName: 'Chuka Nwosu',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitId: 'unit_003',
    unitName: 'Unit 3B',
    amount: 450_000,
    dueDate: '2026-07-15',
    status: 'overdue',
    escrowStatus: 'frozen',
    disputeReason: 'Tenant disputes a maintenance deduction applied to this payment.',
  },
  {
    id: 'pay_004',
    tenantId: 'tenant_004',
    tenantName: 'Ifeoma Bello',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitId: 'unit_005',
    unitName: 'Unit 1A',
    amount: 580_000,
    dueDate: '2026-08-01',
    paidDate: '2026-08-01',
    status: 'paid',
    escrowStatus: 'pending_review',
  },
  {
    id: 'pay_005',
    tenantId: 'tenant_005',
    tenantName: 'Segun Adeyemi',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitId: 'unit_006',
    unitName: 'Unit 1B',
    amount: 580_000,
    dueDate: '2026-08-14',
    status: 'pending',
    escrowStatus: 'held',
  },
  {
    id: 'pay_006',
    tenantId: 'tenant_006',
    tenantName: 'Ngozi Eze',
    propertyId: 'prop_003',
    propertyName: 'Modern Downtown Loft',
    unitId: 'unit_008',
    unitName: 'Unit A',
    amount: 450_000,
    dueDate: '2026-07-05',
    paidDate: '2026-07-04',
    status: 'paid',
    escrowStatus: 'released',
    releaseDate: '2026-07-06',
  },
];

const statusFilters: { value: 'all' | RentPaymentStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

export default function LandlordPaymentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | RentPaymentStatus>('all');
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role && parsedUser.role !== 'landlord') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setPayments(mockPayments);
      const now = Date.now();
      setUpcomingPayments(
        mockPayments.filter((p) => {
          const daysUntilDue = Math.ceil(
            (new Date(p.dueDate).getTime() - now) / (1000 * 60 * 60 * 24)
          );
          return p.status === 'pending' && daysUntilDue >= 0 && daysUntilDue <= 7;
        }).length
      );
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalCollected = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const outstandingBalance = payments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);
  const escrowPending = payments
    .filter((p) => p.escrowStatus === 'held' || p.escrowStatus === 'pending_review')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <LandlordNavbar user={user} />

      <div className="flex">
        <LandlordSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track rent collection and escrow status
              </p>
            </div>

            <RentCollectionStats
              totalCollected={totalCollected}
              outstandingBalance={outstandingBalance}
              escrowPending={escrowPending}
              upcomingPayments={upcomingPayments}
            />

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tenants or properties..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit">
                {statusFilters.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      filter === option.value
                        ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <PaymentsTable payments={filteredPayments} onViewDetails={setSelectedPayment} />
          </div>
        </main>
      </div>

      <PaymentDetailsModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
    </div>
  );
}
