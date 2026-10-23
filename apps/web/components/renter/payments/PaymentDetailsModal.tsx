'use client';

import {
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Calendar,
  CreditCard,
  Building2,
  Wallet,
  Download,
  MessageCircle,
} from 'lucide-react';
import { NairaSign } from '@getrentos/ui/NairaSign';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@getrentos/ui';
import { escrowStatusBadges } from '@/lib/statusBadge';
import { InvoiceLines, type InvoiceLine } from '@/components/shared/InvoiceLines';

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
  releaseDate?: string;
  heldReason?: string;
  periodStart?: string;
  periodEnd?: string;
  lines?: InvoiceLine[];
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
        return { label: 'Paid', color: 'text-success', icon: CheckCircle };
      case 'pending':
        return { label: 'Pending', color: 'text-warning', icon: Clock };
      case 'overdue':
        return { label: 'Overdue', color: 'text-destructive', icon: AlertCircle };
      case 'processing':
        return { label: 'Processing', color: 'text-info', icon: Clock };
      default:
        return { label: 'Unknown', color: 'text-muted-foreground', icon: Clock };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 sm:p-0">
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Payment Details</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {payment.propertyName}
          </DialogDescription>
        </div>

        <div className="p-4 space-y-4">
          {/* Amount & Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(payment.amount)}</p>
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${statusConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </div>
          </div>

          <InvoiceLines
            lines={payment.lines}
            periodStart={payment.periodStart}
            periodEnd={payment.periodEnd}
          />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Due Date</span>
              </div>
              <p className="text-sm font-medium text-foreground">{formatDate(payment.dueDate)}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary">
              <div className="flex items-center gap-1">
                <NairaSign className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Paid On</span>
              </div>
              <p className="text-sm font-medium text-foreground">{formatDate(payment.date)}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-2 rounded-lg bg-secondary">
            <div className="flex items-center gap-1">
              {payment.method === 'card' && (
                <CreditCard className="w-3 h-3 text-muted-foreground" />
              )}
              {payment.method === 'bank_transfer' && (
                <Building2 className="w-3 h-3 text-muted-foreground" />
              )}
              {payment.method === 'wallet' && <Wallet className="w-3 h-3 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground">Payment Method</span>
            </div>
            <p className="text-sm font-medium text-foreground capitalize">
              {payment.method.replace('_', ' ')}
            </p>
          </div>

          {/* Where the money is */}
          <Alert variant="info" icon={Shield} title="Where your money is">
            {escrowStatusBadges[payment.escrowStatus]?.label ?? payment.escrowStatus}
            {payment.escrowStatus === 'held' && payment.releaseDate && (
              <p className="text-xs mt-1">
                Releases to your landlord on{' '}
                {new Date(payment.releaseDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                . Held under GetRentos Payment Protection until then, so you have the home in hand first.
              </p>
            )}
          </Alert>

          {/* Description */}
          <div className="p-2 rounded-lg bg-secondary">
            <span className="text-xs text-muted-foreground">Description</span>
            <p className="text-sm text-foreground mt-0.5">{payment.description}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {payment.receiptUrl && (
              <Button
                variant="primary"
                className="flex-1"
                icon={<Download className="w-4 h-4" />}
                onClick={() => onDownloadReceipt(payment.id)}
              >
                Download Receipt
              </Button>
            )}
            {payment.status === 'overdue' && (
              <Button
                variant="danger"
                className="flex-1"
                icon={<MessageCircle className="w-4 h-4" />}
                onClick={() => onDispute(payment.id)}
              >
                Dispute
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
