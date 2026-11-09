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
  feeNaira?: number;
  totalChargedNaira?: number;
  heldAmountNaira?: number;
  resumeCheckout?: { url: string; reference: string; expiresAt: string };
  periodStart?: string;
  periodEnd?: string;
  lines?: { category: string; label: string; amount: number }[];
}

export type PaymentStatusFilter = 'all' | Payment['status'];
type StatusFilter = PaymentStatusFilter;

interface PaymentsListProps {
  payments: Payment[];
  /** Every payment the renter has, across all pages (the list holds one page). */
  total: number;
  onPayNow: (id: string) => void;
  onDownloadReceipt: (id: string) => void;
  onDispute: (id: string) => void;
  onConfirmMoveIn: (id: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: StatusFilter;
  onFilterChange: (value: StatusFilter) => void;
  /**
   * True when the API searched and filtered every payment itself. An older API
   * ignores both, so the list falls back to filtering the page it holds.
   */
  serverFiltered: boolean;
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
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  serverFiltered,
}: PaymentsListProps) => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // An older API pages the history without searching or filtering it, so both
  // work on the payments shown here; say so rather than miss older charges.
  const pageOnly = !serverFiltered && total > payments.length;
  const filtering = searchTerm.trim() !== '' || filterStatus !== 'all';

  const filteredPayments = serverFiltered
    ? payments
    : payments.filter((payment) => {
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
                {serverFiltered && filtering
                  ? total === 1
                    ? '1 payment matches'
                    : `${total} payments match`
                  : total === 1
                    ? '1 payment'
                    : `${total} payments`}
              </p>
            </div>

            <SearchInput
              value={searchTerm}
              onValueChange={onSearchChange}
              placeholder={pageOnly ? 'Search this page...' : 'Search property or reference...'}
              label={
                pageOnly
                  ? 'Search payments on this page'
                  : 'Search payments by property or reference'
              }
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
                onClick={() => onFilterChange(option.value)}
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
