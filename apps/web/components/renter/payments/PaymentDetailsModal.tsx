'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Calendar,
  DollarSign,
  CreditCard,
  Building2,
  Wallet,
  Download,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@getrentos/ui';

interface Payment {
  id: string;
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

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onDownloadReceipt: (id: string) => void;
  onDispute: (id: string) => void;
}

export const PaymentDetailsModal = ({
  isOpen,
  onClose,
  payment,
  onDownloadReceipt,
  onDispute,
}: PaymentDetailsModalProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusConfig = () => {
    switch (payment.status) {
      case 'paid':
        return { label: 'Paid', color: 'text-green-600', icon: CheckCircle };
      case 'pending':
        return { label: 'Pending', color: 'text-yellow-600', icon: Clock };
      case 'overdue':
        return { label: 'Overdue', color: 'text-red-600', icon: AlertCircle };
      case 'processing':
        return { label: 'Processing', color: 'text-blue-600', icon: Clock };
      default:
        return { label: 'Unknown', color: 'text-gray-600', icon: Clock };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Payment Details</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{payment.propertyName}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Amount & Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${statusConfig.color}`}
                >
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Due Date</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(payment.dueDate)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Paid On</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{formatDate(payment.date)}</p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                <div className="flex items-center gap-1">
                  {payment.method === 'card' && <CreditCard className="w-3 h-3 text-gray-400" />}
                  {payment.method === 'bank_transfer' && (
                    <Building2 className="w-3 h-3 text-gray-400" />
                  )}
                  {payment.method === 'wallet' && <Wallet className="w-3 h-3 text-gray-400" />}
                  <span className="text-xs text-gray-500">Payment Method</span>
                </div>
                <p className="text-sm font-medium text-foreground capitalize">
                  {payment.method.replace('_', ' ')}
                </p>
              </div>

              {/* Escrow Status */}
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Escrow Status
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 capitalize mt-0.5">
                  {payment.escrowStatus} {payment.escrowStatus === 'held' && '🔒'}
                </p>
              </div>

              {/* Description */}
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                <span className="text-xs text-gray-500">Description</span>
                <p className="text-sm text-foreground mt-0.5">{payment.description}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {payment.receiptUrl && (
                  <Button
                    variant="primary"
                    className="flex-1 gap-2"
                    onClick={() => onDownloadReceipt(payment.id)}
                  >
                    <Download className="w-4 h-4" />
                    Download Receipt
                  </Button>
                )}
                {payment.status === 'overdue' && (
                  <Button
                    variant="danger"
                    className="flex-1 gap-2"
                    onClick={() => onDispute(payment.id)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Dispute
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
