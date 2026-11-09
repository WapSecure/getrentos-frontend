'use client';

import { useState } from 'react';
import { PaymentCard } from './PaymentCard';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import { CreditCard } from 'lucide-react';
import { Card, EmptyState, SearchInput } from '@getrentos/ui';

interface Payment {
  id: string;
  propertyId: string;
  propertyName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  method?: 'card' | 'bank_transfer' | 'wallet';
  receiptUrl?: string;
  description: string;
  dueDate: string;
  escrowStatus: 'not_funded' | 'held' | 'pending_review' | 'released' | 'frozen';
  releaseDate?: string;
  amountPaid?: number;
  outstanding?: number;
  reference?: string;
  resumeCheckout?: { url: string; reference: string; expiresAt: string };
  periodStart?: string;
  periodEnd?: string;
  lines?: { category: string; label: string; amount: number }[];
}

type StatusFilter = 'all' | Payment['status'];

interface PaymentsListProps {
  payments: Payment[];
  /** Every payment the renter has, across all pages (the list holds one page). */
  total: number;
  onPayNow: (id: string) => void;
  onDownloadReceipt: (id: string) => void;
  onDispute: (id: string) => void;
  onConfirmMoveIn: (id: string) => void;
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Due' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'processing', label: 'Processing' },
  { value: 'paid', label: 'Paid' },
];

export const PaymentsList = ({
  payments,
  total,
  onPayNow,
  onDownloadReceipt,
  onDispute,
  onConfirmMoveIn,
}: PaymentsListProps) => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');

  // The API pages the history and has no search or status filter, so both work
  // on the payments shown here. Say so rather than miss older charges silently.
  const pageOnly = total > payments.length;

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

  return (
    <>
      <Card>
        <div className="border-b border-border/70 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">Payment history</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {total === 1 ? '1 payment' : `${total} payments`}
              </p>
            </div>

            <SearchInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder={pageOnly ? 'Search this page...' : 'Search payments...'}
              label={pageOnly ? 'Search payments on this page' : 'Search payment history'}
              className="w-full sm:w-56"
            />
          </div>

          <div
            role="group"
            aria-label="Payment status"
            className="mt-4 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border/70 bg-secondary/80 p-1"
          >
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filterStatus === option.value}
                onClick={() => setFilterStatus(option.value)}
                className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-primary/12 aria-pressed:bg-card aria-pressed:text-primary aria-pressed:shadow-sm"
              >
                {option.label}
              </button>
            ))}
          </div>
          {pageOnly && (
            <p className="mt-2 text-xs text-muted-foreground">
              Search and filters look at the {payments.length} payments on this page. Use the pages
              below to see older ones.
            </p>
          )}
        </div>

        <div className="divide-y divide-border">
          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments found"
              description={
                pageOnly
                  ? 'Nothing on this page matches. Try another page, search or filter.'
                  : 'Try adjusting your search or payment-status filter.'
              }
              bare
            />
          ) : (
            filteredPayments.map((payment) => (
              <div key={payment.id}>
                <PaymentCard
                  payment={payment}
                  onViewDetails={() => handleViewDetails(payment)}
                  onPayNow={() => onPayNow(payment.id)}
                  onDownloadReceipt={() => onDownloadReceipt(payment.id)}
                  onDispute={() => onDispute(payment.id)}
                  onConfirmMoveIn={() => onConfirmMoveIn(payment.id)}
                />
              </div>
            ))
          )}
        </div>
      </Card>

      {selectedPayment && (
        <PaymentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          payment={selectedPayment}
          onDownloadReceipt={onDownloadReceipt}
          onDispute={onDispute}
          onConfirmMoveIn={onConfirmMoveIn}
        />
      )}
    </>
  );
};
