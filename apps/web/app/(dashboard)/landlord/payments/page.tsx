'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { RentCollectionStats } from '@/components/landlord/payments/RentCollectionStats';
import { PaymentsTable } from '@/components/landlord/payments/PaymentsTable';
import { PaymentDetailsModal } from '@/components/landlord/payments/PaymentDetailsModal';
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
  const [payments, setPayments] = useState<RentPayment[]>(mockPayments);
  const [upcomingPayments, setUpcomingPayments] = useState(() => {
    const now = Date.now();
    return mockPayments.filter((p) => {
      const daysUntilDue = Math.ceil((new Date(p.dueDate).getTime() - now) / (1000 * 60 * 60 * 24));
      return p.status === 'pending' && daysUntilDue >= 0 && daysUntilDue <= 7;
    }).length;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | RentPaymentStatus>('all');
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null);

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
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-1">Track rent collection and escrow status</p>
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
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          {statusFilters.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <PaymentsTable payments={filteredPayments} onViewDetails={setSelectedPayment} />

      <PaymentDetailsModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
    </>
  );
}
