'use client';

import { ReceiptText } from '@sureground/icons';
import { Badge, Button, DataTable, EmptyState, type Column } from '@sureground/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { escrowStatusBadges, paymentStatusBadges, rentPayoutStatusBadges } from '@/lib/statusBadge';
import type { RentPayment } from '@/types/landlord';

interface PaymentsTableProps {
  payments: RentPayment[];
  onViewDetails: (payment: RentPayment) => void;
}

export const PaymentsTable = ({ payments, onViewDetails }: PaymentsTableProps) => {
  const columns: Column<RentPayment>[] = [
    {
      key: 'tenant',
      header: 'Tenant',
      render: (payment) => (
        <span className="whitespace-nowrap font-medium text-foreground">{payment.tenantName}</span>
      ),
    },
    {
      // Property and unit on two lines, so the row fits a laptop screen.
      key: 'property',
      header: 'Property',
      render: (payment) => (
        <>
          <span className="block text-foreground">{payment.propertyName}</span>
          <span className="block text-xs text-muted-foreground">{payment.unitName}</span>
        </>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      numeric: true,
      render: (payment) => (
        <span className="whitespace-nowrap font-medium text-foreground">
          {formatCurrency(payment.amount)}
          {payment.status !== 'paid' && (payment.amountPaid ?? 0) > 0 && (
            <span className="block text-xs font-normal text-success">
              {formatCurrency(payment.amountPaid ?? 0)} paid
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'due',
      header: 'Due date',
      render: (payment) => (
        <span className="whitespace-nowrap tabular-nums text-muted-foreground">
          {formatDate(payment.dueDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Payment status',
      render: (payment) => {
        const status = paymentStatusBadges[payment.status];
        return (
          <Badge variant={status.variant} dot>
            {status.label}
          </Badge>
        );
      },
    },
    {
      key: 'protection',
      header: 'Payment Protection',
      render: (payment) => {
        const escrow = escrowStatusBadges[payment.escrowStatus];
        return (
          <Badge variant={escrow.variant} icon={escrow.icon && <escrow.icon className="h-3 w-3" />}>
            {escrow.label}
          </Badge>
        );
      },
    },
    {
      key: 'payout',
      header: 'Payout',
      render: (payment) => {
        const payout = payment.payoutStatus ? rentPayoutStatusBadges[payment.payoutStatus] : null;
        return payout ? (
          <Badge variant={payout.variant} icon={payout.icon && <payout.icon className="h-3 w-3" />}>
            {payout.label}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      srHeader: 'Actions',
      align: 'right',
      render: (payment) => (
        <Button
          variant="ghost"
          size="xs"
          className="text-primary"
          onClick={() => onViewDetails(payment)}
          aria-label={`View details for ${payment.tenantName}`}
        >
          View details
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      caption="Rent payments"
      columns={columns}
      data={payments}
      getRowKey={(payment) => payment.id}
      emptyState={<EmptyState icon={ReceiptText} title="No payments found" />}
    />
  );
};
