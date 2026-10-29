'use client';

import { ReceiptText } from 'lucide-react';
import { Badge, Button, EmptyState } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { escrowStatusBadges, paymentStatusBadges } from '@/lib/statusBadge';
import type { RentPayment } from '@/types/landlord';

interface PaymentsTableProps {
  payments: RentPayment[];
  onViewDetails: (payment: RentPayment) => void;
}

export const PaymentsTable = ({ payments, onViewDetails }: PaymentsTableProps) => {
  if (payments.length === 0) {
    return <EmptyState icon={ReceiptText} title="No payments found" />;
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
              <th className="px-4 py-3 font-medium text-muted-foreground">Payout</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((payment) => {
              const escrow = escrowStatusBadges[payment.escrowStatus];
              const status = paymentStatusBadges[payment.status];
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
                    {payment.status !== 'paid' && (payment.amountPaid ?? 0) > 0 && (
                      <span className="block text-xs font-normal text-success">
                        {formatCurrency(payment.amountPaid ?? 0, { compact: true })} paid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(payment.dueDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={escrow.variant}
                      icon={escrow.icon && <escrow.icon className="w-3 h-3" />}
                    >
                      {escrow.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-primary"
                      onClick={() => onViewDetails(payment)}
                      aria-label={`View details for ${payment.tenantName}`}
                    >
                      View Details
                    </Button>
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
