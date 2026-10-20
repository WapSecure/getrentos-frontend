'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PaymentCard } from './PaymentCard';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import { CreditCard } from 'lucide-react';
import { Card, EmptyState, SearchInput, Tabs, TabsList, TabsTrigger } from '@getrentos/ui';

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
  amountPaid?: number;
  periodStart?: string;
  periodEnd?: string;
  lines?: { category: string; label: string; amount: number }[];
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
      <Card>
        <div className="border-b border-border/70 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Payment History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {payments.length} payments total
              </p>
            </div>

            {/* Search */}
            <SearchInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Search payments..."
              label="Search payment history"
              className="w-full sm:w-56"
            />
          </div>

          {/* Status Filters */}
          <Tabs
            value={filterStatus}
            onValueChange={(value) =>
              setFilterStatus(value as 'all' | 'paid' | 'pending' | 'overdue' | 'processing')
            }
          >
            <TabsList aria-label="Payment status" className="mt-4 max-w-full">
              {statusOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="divide-y divide-border">
          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments found"
              description="Try adjusting your search or payment-status filter."
              bare
            />
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
      </Card>

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
