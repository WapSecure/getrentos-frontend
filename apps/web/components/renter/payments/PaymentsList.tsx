'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentCard } from './PaymentCard';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import { CreditCard, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Payment History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {payments.length} payments total
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <LegacyInput
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search payments..."
                className="pl-10 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-48"
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 mt-3">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setFilterStatus(
                    option.value as 'all' | 'paid' | 'pending' | 'overdue' | 'processing'
                  )
                }
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === option.value
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-muted-foreground hover:bg-gray-200 dark:hover:bg-white/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No payments found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
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
