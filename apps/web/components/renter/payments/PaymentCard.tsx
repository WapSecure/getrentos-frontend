'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Building2,
  Wallet,
  ChevronRight,
  Download,
  Shield,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

interface PaymentCardProps {
  payment: Payment;
  onViewDetails: () => void;
  onPayNow: () => void;
  onDownloadReceipt: () => void;
  onDispute: () => void;
}

const methodIcons: Record<Payment['method'], typeof CreditCard> = {
  card: CreditCard,
  bank_transfer: Building2,
  wallet: Wallet,
};

export const PaymentCard = ({
  payment,
  onViewDetails,
  onPayNow,
  onDownloadReceipt,
  onDispute,
}: PaymentCardProps) => {
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusConfig = () => {
    switch (payment.status) {
      case 'paid':
        return {
          label: 'Paid',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          icon: CheckCircle,
        };
      case 'pending':
        return {
          label: 'Pending',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          icon: Clock,
        };
      case 'overdue':
        return {
          label: 'Overdue',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          icon: AlertCircle,
        };
      case 'processing':
        return {
          label: 'Processing',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
          icon: Clock,
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const MethodIcon = methodIcons[payment.method] ?? CreditCard;

  const isPayable = payment.status === 'pending' || payment.status === 'overdue';

  return (
    <div className="p-4 hover:bg-secondary transition-colors cursor-pointer group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Status Icon */}
        <div
          className={`w-10 h-10 rounded-full ${statusConfig.color} flex items-center justify-center shrink-0`}
        >
          <StatusIcon className="w-5 h-5" />
        </div>

        {/* Payment Info */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-foreground">{payment.propertyName}</h4>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-muted-foreground">
              <MethodIcon className="w-3 h-3" />
              {payment.method.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{payment.description}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Due {formatDate(payment.dueDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Escrow: {payment.escrowStatus}</span>
            </div>
          </div>
        </div>

        {/* Amount & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{formatCurrency(payment.amount)}</p>
            <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
          </div>

          <div className="flex gap-1">
            {isPayable && (
              <Button
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onPayNow();
                }}
                className="whitespace-nowrap"
              >
                Pay Now
              </Button>
            )}
            {payment.receiptUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadReceipt();
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Download receipt"
              >
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="View details"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
