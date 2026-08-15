'use client';

import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { escrowStatusBadges, paymentStatusBadges } from '@/lib/statusBadge';
import type { RentPayment } from '@/types/landlord';

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
                    <button
                      onClick={() => onViewDetails(payment)}
                      className="text-xs font-medium text-primary hover:text-primary-hover whitespace-nowrap"
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
