'use client';

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
} from 'lucide-react';
import { Badge, Button, type BadgeVariant } from '@getrentos/ui';

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
  escrowStatus: 'not_funded' | 'held' | 'pending_review' | 'released' | 'frozen';
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

/** Plain-language escrow state for collected funds. */
const escrowLabel = (status: Payment['escrowStatus']): string =>
  ({
    not_funded: 'not funded yet',
    held: 'held by GetRentos',
    pending_review: 'under review',
    released: 'released to your landlord',
    frozen: 'frozen',
  })[status] ?? status;

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
          variant: 'success' as BadgeVariant,
          icon: CheckCircle,
        };
      case 'pending':
        return {
          label: 'Pending',
          variant: 'warning' as BadgeVariant,
          icon: Clock,
        };
      case 'overdue':
        return {
          label: 'Overdue',
          variant: 'danger' as BadgeVariant,
          icon: AlertCircle,
        };
      case 'processing':
        return {
          label: 'Processing',
          variant: 'info' as BadgeVariant,
          icon: Clock,
        };
      default:
        return {
          label: 'Unknown',
          variant: 'neutral' as BadgeVariant,
          icon: Clock,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const MethodIcon = methodIcons[payment.method] ?? CreditCard;

  const isPayable = payment.status === 'pending' || payment.status === 'overdue';

  return (
    <article className="group p-4 transition-colors hover:bg-secondary/50 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Status Icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <StatusIcon className="h-5 w-5" aria-hidden="true" />
        </div>

        {/* Payment Info */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-foreground">{payment.propertyName}</h4>
            <Badge variant={statusConfig.variant} icon={<StatusIcon className="h-3 w-3" />}>
              {statusConfig.label}
            </Badge>
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
            {payment.status === 'paid' && (
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Your money: {escrowLabel(payment.escrowStatus)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Amount & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{formatCurrency(payment.amount)}</p>
            <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
          </div>

          <div className="flex items-center gap-1">
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
                Pay now
              </Button>
            )}
            {payment.status === 'paid' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  onDispute();
                }}
                className="text-muted-foreground"
              >
                Report issue
              </Button>
            )}
            {payment.receiptUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadReceipt();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                aria-label="Download receipt"
              >
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              aria-label="View payment details"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
