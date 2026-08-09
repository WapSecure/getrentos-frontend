'use client';

import { Lock, Clock, CheckCircle2, Ban } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { RentPayment, EscrowStatus, RentPaymentStatus } from '@/types/landlord';

const escrowConfig: Record<
  EscrowStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  held: {
    label: 'Held',
    icon: Lock,
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  pending_review: {
    label: 'Pending Review',
    icon: Clock,
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  released: {
    label: 'Released',
    icon: CheckCircle2,
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  frozen: {
    label: 'Frozen',
    icon: Ban,
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

const statusConfig: Record<RentPaymentStatus, { label: string; className: string }> = {
  paid: {
    label: 'Paid',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  pending: {
    label: 'Pending',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  overdue: {
    label: 'Overdue',
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
  processing: {
    label: 'Processing',
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
};

interface PaymentsTableProps {
  payments: RentPayment[];
  onViewDetails: (payment: RentPayment) => void;
}

export const PaymentsTable = ({ payments, onViewDetails }: PaymentsTableProps) => {
  if (payments.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center">
        <p className="text-muted-foreground">No payments found</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Tenant</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Property</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Due Date</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Payment Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Escrow Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((payment) => {
              const escrow = escrowConfig[payment.escrowStatus];
              const status = statusConfig[payment.status];
              const EscrowIcon = escrow.icon;
              return (
                <tr key={payment.id} className="hover:bg-secondary transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {payment.tenantName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {payment.propertyName} • {payment.unitName}
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">
                    {formatCurrency(payment.amount, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(payment.dueDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${escrow.className}`}
                    >
                      <EscrowIcon className="w-3 h-3" />
                      {escrow.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onViewDetails(payment)}
                      className="text-xs font-medium text-primary hover:text-[#a88d3a] whitespace-nowrap"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
