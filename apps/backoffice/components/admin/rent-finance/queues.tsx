'use client';

import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Coins, Landmark, Receipt, Wallet } from 'lucide-react';
import { Badge, Button, ConfirmDialog, Toast, type BadgeVariant } from '@getrentos/ui';
import { ApiError, unwrap } from '@getrentos/shared';
import { adminRentFinanceService } from '@/services/adminRentFinanceService';
import {
  RentFinanceQueuePage,
  type RentFinanceQueueConfig,
  type RentFinanceQueueFilter,
} from './RentFinanceQueuePage';
import type {
  AdminExpense,
  AdminOwnerStatement,
  AdminPayoutAccount,
  AdminRentPayment,
  ExpenseCategory,
  RentEscrowStatus,
  RentPaymentStatus,
} from '@/types/rentFinance';

const naira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const Pill = ({ label, variant }: { label: string; variant: BadgeVariant }) => (
  <Badge variant={variant}>{label}</Badge>
);

const Cell = ({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) => (
  <div className="min-w-0">
    <p className="font-medium text-foreground">{primary}</p>
    {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
  </div>
);

const paymentStatusVariant = (status: RentPaymentStatus): BadgeVariant => {
  const map: Record<RentPaymentStatus, BadgeVariant> = {
    PAID: 'success',
    PENDING: 'warning',
    OVERDUE: 'danger',
    PROCESSING: 'info',
  };
  return map[status] ?? 'neutral';
};

const escrowVariant = (status: RentEscrowStatus): BadgeVariant => {
  const map: Record<RentEscrowStatus, BadgeVariant> = {
    HELD: 'info',
    PENDING_REVIEW: 'warning',
    RELEASED: 'success',
    FROZEN: 'danger',
  };
  return map[status] ?? 'neutral';
};

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const btn = (
  label: string,
  onClick: () => void,
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' = 'outline',
  isLoading = false,
  disabled = false
) => (
  <Button
    type="button"
    size="xs"
    variant={variant}
    onClick={onClick}
    isLoading={isLoading}
    disabled={disabled}
  >
    {label}
  </Button>
);

function ActionGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1.5">{children}</div>;
}

const isDueForSettlement = (p: AdminRentPayment) =>
  p.status === 'PAID' &&
  p.escrowStatus === 'HELD' &&
  p.releaseDate !== null &&
  Date.parse(p.releaseDate) <= Date.now();

const paymentStatusOptions = [
  { value: 'PAID', label: 'Paid' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PROCESSING', label: 'Processing' },
];
const escrowStatusOptions = [
  { value: 'HELD', label: 'Held' },
  { value: 'PENDING_REVIEW', label: 'Under review' },
  { value: 'RELEASED', label: 'Released' },
  { value: 'FROZEN', label: 'Frozen' },
];
const statementStatusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ISSUED', label: 'Issued' },
];
const verifiedFilterOptions = [
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
];
const expenseCategoryOptions: { value: ExpenseCategory; label: string }[] = [
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'TAX', label: 'Tax' },
  { value: 'REPAIRS', label: 'Repairs' },
  { value: 'MANAGEMENT_FEE', label: 'Management fee' },
  { value: 'OTHER', label: 'Other' },
];

export function PaymentsQueue() {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<{
    type: 'release' | 'flag' | 'clear';
    payment: AdminRentPayment;
  } | null>(null);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const executeAction = async () => {
    if (!pendingAction || processingKey) return;
    const { type, payment } = pendingAction;
    const actionKey = `${type}:${payment.id}`;
    setPendingAction(null);
    setProcessingKey(actionKey);
    try {
      if (type === 'release') {
        await unwrap(adminRentFinanceService.releasePayment(payment.id));
      } else if (type === 'flag') {
        await unwrap(adminRentFinanceService.flagPayment(payment.id));
      } else {
        await unwrap(adminRentFinanceService.unflagPayment(payment.id));
      }
      const successMessage = {
        release: `${naira(payment.amount)} was released for ${payment.propertyTitle}.`,
        flag: `Payment for ${payment.propertyTitle} was moved to manual review.`,
        clear: `Manual review was cleared for ${payment.propertyTitle}.`,
      }[type];
      setToast({ message: successMessage, variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'rentFinance'] });
    } catch (error) {
      setToast({
        message:
          error instanceof ApiError
            ? error.message
            : 'The finance action could not be completed. Please try again.',
        variant: 'error',
      });
    } finally {
      setProcessingKey(null);
    }
  };

  const actionCopy = pendingAction
    ? {
        release: {
          title: 'Release escrow funds?',
          description: `${naira(pendingAction.payment.amount)} for ${pendingAction.payment.propertyTitle} will be released to the landlord payout flow. This action cannot be undone here.`,
          label: 'Release funds',
        },
        flag: {
          title: 'Flag payment for review?',
          description: `The payment for ${pendingAction.payment.propertyTitle} will be held for manual review and cannot be released until the review is cleared.`,
          label: 'Flag payment',
        },
        clear: {
          title: 'Clear manual review?',
          description: `The review hold on the payment for ${pendingAction.payment.propertyTitle} will be removed. This does not release the funds automatically.`,
          label: 'Clear review',
        },
      }[pendingAction.type]
    : null;
  const filters: RentFinanceQueueFilter[] = [
    { key: 'status', label: 'Status', options: paymentStatusOptions },
    { key: 'escrowStatus', label: 'Escrow', options: escrowStatusOptions },
  ];
  const config: RentFinanceQueueConfig<AdminRentPayment> = {
    resource: 'payments',
    eyebrow: 'Rent Payments',
    title: 'Rent payment ledger',
    description: 'Platform-wide rent collections with escrow review and settlement actions.',
    icon: Wallet,
    filters,
    listFn: (params) => adminRentFinanceService.listPayments(params),
    exportFn: (params) => adminRentFinanceService.exportPayments(params),
    exportFilename: 'rent-payments.csv',
    getRowKey: (p) => p.id,
    columns: [
      {
        key: 'property',
        header: 'Property',
        render: (p) => (
          <Cell primary={p.propertyTitle} secondary={p.unitName ?? `${p.city}, ${p.state}`} />
        ),
      },
      {
        key: 'parties',
        header: 'Tenant / Landlord',
        render: (p) => <Cell primary={p.tenantName ?? '—'} secondary={p.ownerName ?? ''} />,
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (p) => <p className="font-medium text-foreground">{naira(p.amount)}</p>,
      },
      {
        key: 'due',
        header: 'Due / Paid',
        render: (p) => (
          <Cell
            primary={date(p.dueDate)}
            secondary={p.paidDate ? `Paid ${date(p.paidDate)}` : p.isArrears ? 'Overdue' : 'Unpaid'}
          />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (p) => (
          <div className="flex flex-wrap gap-1">
            <Pill label={titleCase(p.status)} variant={paymentStatusVariant(p.status)} />
            <Pill label={titleCase(p.escrowStatus)} variant={escrowVariant(p.escrowStatus)} />
          </div>
        ),
      },
      {
        key: 'created',
        header: 'Created',
        render: (p) => <span className="text-muted-foreground">{date(p.createdAt)}</span>,
      },
    ],
    actions: (p) => (
      <ActionGroup>
        {p.status === 'PAID' && p.escrowStatus === 'HELD' && (
          <>
            {isDueForSettlement(p) &&
              btn(
                'Release',
                () => setPendingAction({ type: 'release', payment: p }),
                'outline',
                processingKey === `release:${p.id}`,
                processingKey !== null
              )}
            {btn(
              'Flag',
              () => setPendingAction({ type: 'flag', payment: p }),
              'ghost',
              processingKey === `flag:${p.id}`,
              processingKey !== null
            )}
          </>
        )}
        {p.status === 'PAID' &&
          p.escrowStatus === 'PENDING_REVIEW' &&
          btn(
            'Clear review',
            () => setPendingAction({ type: 'clear', payment: p }),
            'outline',
            processingKey === `clear:${p.id}`,
            processingKey !== null
          )}
      </ActionGroup>
    ),
  };
  return (
    <>
      <RentFinanceQueuePage config={config} />
      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={actionCopy?.title ?? 'Confirm finance action'}
        description={actionCopy?.description ?? ''}
        confirmLabel={actionCopy?.label ?? 'Confirm'}
        onConfirm={() => void executeAction()}
      />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}

export function ArrearsQueue() {
  const config: RentFinanceQueueConfig<AdminRentPayment> = {
    resource: 'arrears',
    eyebrow: 'Arrears',
    title: 'Rent arrears ledger',
    description: 'Live unpaid rent payments whose due date has passed.',
    icon: AlertTriangle,
    filters: [{ key: 'escrowStatus', label: 'Escrow', options: escrowStatusOptions }],
    listFn: (params) => adminRentFinanceService.listArrears(params),
    exportFn: (params) => adminRentFinanceService.exportArrears(params),
    exportFilename: 'rent-arrears.csv',
    getRowKey: (p) => p.id,
    columns: [
      {
        key: 'property',
        header: 'Property',
        render: (p) => (
          <Cell primary={p.propertyTitle} secondary={p.unitName ?? `${p.city}, ${p.state}`} />
        ),
      },
      {
        key: 'tenant',
        header: 'Tenant / Landlord',
        render: (p) => <Cell primary={p.tenantName ?? '—'} secondary={p.ownerName ?? ''} />,
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (p) => <p className="font-medium text-foreground">{naira(p.amount)}</p>,
      },
      {
        key: 'due',
        header: 'Due',
        render: (p) => (
          <Cell
            primary={date(p.dueDate)}
            secondary={`${Math.max(
              0,
              Math.floor((Date.now() - Date.parse(p.dueDate)) / 86_400_000)
            )}d overdue`}
          />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (p) => (
          <div className="flex flex-wrap gap-1">
            <Pill label={titleCase(p.status)} variant={paymentStatusVariant(p.status)} />
            <Pill label={titleCase(p.escrowStatus)} variant={escrowVariant(p.escrowStatus)} />
          </div>
        ),
      },
    ],
  };
  return <RentFinanceQueuePage config={config} />;
}

export function StatementsQueue() {
  const config: RentFinanceQueueConfig<AdminOwnerStatement> = {
    resource: 'statements',
    eyebrow: 'Owner Statements',
    title: 'Owner statement register',
    description: 'Landlord owner statements with net payouts across managed properties.',
    icon: Receipt,
    filters: [{ key: 'status', label: 'Status', options: statementStatusOptions }],
    listFn: (params) => adminRentFinanceService.listStatements(params),
    exportFn: (params) => adminRentFinanceService.exportStatements(params),
    exportFilename: 'owner-statements.csv',
    getRowKey: (s) => s.id,
    columns: [
      {
        key: 'owner',
        header: 'Owner',
        render: (s) => <Cell primary={s.ownerName} secondary={s.ownerEmail ?? ''} />,
      },
      {
        key: 'org',
        header: 'Organization',
        render: (s) => (
          <span className="text-muted-foreground">{s.organizationName ?? 'Self-managed'}</span>
        ),
      },
      {
        key: 'period',
        header: 'Period',
        render: (s) => <Cell primary={date(s.periodStart)} secondary={`to ${date(s.periodEnd)}`} />,
      },
      {
        key: 'net',
        header: 'Net payout',
        render: (s) => (
          <Cell primary={naira(s.netPayout)} secondary={`Gross ${naira(s.grossIncome)}`} />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (s) => (
          <Pill
            label={titleCase(s.status)}
            variant={s.status === 'ISSUED' ? 'success' : 'neutral'}
          />
        ),
      },
      {
        key: 'generated',
        header: 'Generated',
        render: (s) => <span className="text-muted-foreground">{date(s.generatedAt)}</span>,
      },
    ],
  };
  return <RentFinanceQueuePage config={config} />;
}

export function PayoutAccountsQueue() {
  const config: RentFinanceQueueConfig<AdminPayoutAccount> = {
    resource: 'payout-accounts',
    eyebrow: 'Payout Accounts',
    title: 'Landlord payout accounts',
    description: 'Disbursement readiness — who can actually be paid out.',
    icon: Landmark,
    filters: [{ key: 'verified', label: 'Verified', options: verifiedFilterOptions }],
    listFn: (params) => adminRentFinanceService.listPayoutAccounts(params),
    exportFn: (params) => adminRentFinanceService.exportPayoutAccounts(params),
    exportFilename: 'landlord-payout-accounts.csv',
    getRowKey: (a) => a.id,
    columns: [
      {
        key: 'landlord',
        header: 'Landlord',
        render: (a) => <Cell primary={a.landlordName} secondary={a.landlordEmail ?? ''} />,
      },
      {
        key: 'bank',
        header: 'Account',
        render: (a) => (
          <Cell
            primary={a.bankName ?? '—'}
            secondary={a.accountNumber ? `••${a.accountNumber.slice(-4)}` : 'No account number'}
          />
        ),
      },
      {
        key: 'accountName',
        header: 'Account name',
        render: (a) => <span className="text-muted-foreground">{a.accountName ?? '—'}</span>,
      },
      {
        key: 'readiness',
        header: 'Readiness',
        render: (a) => (
          <div className="flex flex-wrap gap-1">
            <Pill
              label={a.verified ? 'Verified' : 'Unverified'}
              variant={a.verified ? 'success' : 'warning'}
            />
            <Pill
              label={a.complete ? 'Complete' : 'Incomplete'}
              variant={a.complete ? 'success' : 'danger'}
            />
          </div>
        ),
      },
      {
        key: 'updated',
        header: 'Updated',
        render: (a) => <span className="text-muted-foreground">{date(a.updatedAt)}</span>,
      },
    ],
  };
  return <RentFinanceQueuePage config={config} />;
}

export function ExpensesQueue() {
  const config: RentFinanceQueueConfig<AdminExpense> = {
    resource: 'expenses',
    eyebrow: 'Expenses',
    title: 'Property expense ledger',
    description: 'Platform-wide property expenses that feed owner-statement reconciliation.',
    icon: Coins,
    filters: [{ key: 'category', label: 'Category', options: expenseCategoryOptions }],
    listFn: (params) => adminRentFinanceService.listExpenses(params),
    exportFn: (params) => adminRentFinanceService.exportExpenses(params),
    exportFilename: 'property-expenses.csv',
    getRowKey: (e) => e.id,
    columns: [
      {
        key: 'property',
        header: 'Property',
        render: (e) => (
          <Cell primary={e.propertyTitle} secondary={e.city ? `${e.city}` : (e.ownerName ?? '')} />
        ),
      },
      {
        key: 'owner',
        header: 'Owner / Added by',
        render: (e) => <Cell primary={e.ownerName ?? '—'} secondary={e.createdByName} />,
      },
      {
        key: 'category',
        header: 'Category',
        render: (e) => <Pill label={titleCase(e.category)} variant="neutral" />,
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (e) => <p className="font-medium text-foreground">{naira(e.amount)}</p>,
      },
      {
        key: 'incurred',
        header: 'Incurred',
        render: (e) => (
          <Cell primary={date(e.incurredAt)} secondary={e.note ? e.note : undefined} />
        ),
      },
    ],
  };
  return <RentFinanceQueuePage config={config} />;
}
