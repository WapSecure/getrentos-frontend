'use client';

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
      <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Payment History</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {payments.length} payments total
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search payments..."
                className="pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747] w-full sm:w-48"
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
                    ? 'bg-[#c4a747] text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-white/10">
          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                No payments found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
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
