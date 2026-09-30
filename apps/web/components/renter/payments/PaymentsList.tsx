'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PaymentCard } from './PaymentCard';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import { CreditCard, Search } from 'lucide-react';
import { EmptyState } from '@getrentos/ui';

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
  escrowStatus: 'not_funded' | 'held' | 'pending_review' | 'released' | 'frozen';
}

interface PaymentsListProps {
  payments: Payment[];
  onPayNow: (id: string) => void;
  onDownloadReceipt: (id: string) => void;
  onDispute: (id: string) => void;
}

export const PaymentsList = ({
  payments,
  onPayNow,
  onDownloadReceipt,
  onDispute,
}: PaymentsListProps) => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'paid' | 'pending' | 'overdue' | 'processing'
  >('all');

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'processing', label: 'Processing' },
  ];

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/70 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Payment History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {payments.length} payments total
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <LegacyInput
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search payments..."
                aria-label="Search payment history"
                className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 sm:w-56"
              />
            </div>
          </div>

          {/* Status Filters */}
          <div
            className="mt-4 flex gap-1 overflow-x-auto"
            role="tablist"
            aria-label="Payment status"
          >
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={filterStatus === option.value}
                onClick={() =>
                  setFilterStatus(
                    option.value as 'all' | 'paid' | 'pending' | 'overdue' | 'processing'
                  )
                }
                className={`min-h-9 shrink-0 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
                  filterStatus === option.value
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/10'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredPayments.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={CreditCard}
                title="No payments found"
                description="Try adjusting your search or payment-status filter."
              />
            </div>
          ) : (
            filteredPayments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PaymentCard
                  payment={payment}
                  onViewDetails={() => handleViewDetails(payment)}
                  onPayNow={() => onPayNow(payment.id)}
                  onDownloadReceipt={() => onDownloadReceipt(payment.id)}
                  onDispute={() => onDispute(payment.id)}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <PaymentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          payment={selectedPayment}
          onDownloadReceipt={onDownloadReceipt}
          onDispute={onDispute}
        />
      )}
    </>
  );
};
