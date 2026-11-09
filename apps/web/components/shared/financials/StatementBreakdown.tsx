'use client';

import { useState } from 'react';
import { ChevronDown, Info } from '@sureground/icons';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';

/** Provenance fields are absent on statements written before the ledger was the source of truth, so all are optional. */
export interface StatementLineItem {
  id: string;
  label: string;
  amount: number;
  ledgerEntryId?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceDetail?: string | null;
  propertyId?: string | null;
}

/** `netPayout` also deducts VAT on the fee and the maintenance markup; `whtAmount` was never a movement, so it is disclosed, not deducted. */
export interface StatementTotals {
  grossIncome: number;
  totalExpenses: number;
  managementFee: number;
  netPayout: number;
  /** Charged on top of the management fee and held for the tax authority. */
  vatAmount?: number | null;
  /** Charged apart from the expense it applies to, so expenses still add up. */
  maintenanceMarkup?: number | null;
  /** Withheld from the manager, never from the owner. Disclosed, not deducted. */
  whtAmount?: number | null;
}

const SOURCE_LABEL: Record<string, string> = {
  RentPayment: 'Rent payment',
  Due: 'Dues collected',
  Expense: 'Expense',
  OwnerStatement: 'Statement charge',
  OwnerStatementReversal: 'Payout reversal',
};

const COMPONENT_LABEL: Record<string, string> = {
  SERVICE_FEE: 'Management fee',
  MAINTENANCE_MARKUP: 'Maintenance markup',
  VAT: 'VAT',
};

const shortRef = (id: string) => `${id.slice(0, 8)}…`;

function Row({ label, amount, deduction }: { label: string; amount: number; deduction?: boolean }) {
  // The sign is composed here, not by negating: `Intl` formats negative zero as "-0".
  const signed = deduction && amount !== 0;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground tabular-nums">
        {signed ? '−' : ''}
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

function TracePanel({ item }: { item: StatementLineItem }) {
  const source = item.sourceType ? (SOURCE_LABEL[item.sourceType] ?? item.sourceType) : null;
  const charge = item.sourceDetail
    ? (COMPONENT_LABEL[item.sourceDetail] ?? item.sourceDetail)
    : null;

  return (
    <dl className="mb-1.5 ml-1 space-y-0.5 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs">
      {source && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">From</dt>
          <dd className="text-foreground">{source}</dd>
        </div>
      )}
      {charge && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Charge</dt>
          <dd className="text-foreground">{charge}</dd>
        </div>
      )}
      {item.ledgerEntryId && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Ledger entry</dt>
          <dd className="font-mono text-2xs text-foreground" title={item.ledgerEntryId}>
            {shortRef(item.ledgerEntryId)}
          </dd>
        </div>
      )}
      {item.sourceId && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Document</dt>
          <dd className="font-mono text-2xs text-foreground" title={item.sourceId}>
            {shortRef(item.sourceId)}
          </dd>
        </div>
      )}
    </dl>
  );
}

export function StatementBreakdown({
  lineItems,
  totals,
  className,
}: {
  lineItems?: StatementLineItem[];
  totals: StatementTotals;
  className?: string;
}) {
  const [traced, setTraced] = useState<string | null>(null);
  const vat = totals.vatAmount ?? 0;
  const markup = totals.maintenanceMarkup ?? 0;
  const wht = totals.whtAmount ?? 0;

  return (
    <div className={className}>
      {lineItems && lineItems.length > 0 && (
        <ul className="space-y-0.5">
          {lineItems.map((item) => {
            const traceable = Boolean(item.ledgerEntryId || item.sourceType);
            const isOpen = traced === item.id;
            return (
              <li key={item.id} className="text-sm">
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="flex min-w-0 items-center gap-1">
                    <span className="truncate text-muted-foreground">{item.label}</span>
                    {traceable && (
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-label={
                          isOpen
                            ? `Hide the ledger entry behind ${item.label}`
                            : `Show the ledger entry behind ${item.label}`
                        }
                        onClick={() => setTraced(isOpen ? null : item.id)}
                        className="shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ChevronDown
                          className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')}
                        />
                      </button>
                    )}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 tabular-nums',
                      item.amount < 0 ? 'text-destructive' : 'text-foreground'
                    )}
                  >
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                {isOpen && <TracePanel item={item} />}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 space-y-2 border-t border-border pt-5">
        <Row label="Gross income" amount={totals.grossIncome} />
        <Row label="Expenses" amount={totals.totalExpenses} deduction />
        {markup > 0 && <Row label="Maintenance markup" amount={markup} deduction />}
        <Row label="Management fee" amount={totals.managementFee} deduction />
        {vat > 0 && <Row label="VAT on the fee" amount={vat} deduction />}
        <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
          <span className="text-foreground">Net payout</span>
          <span className="text-foreground tabular-nums">{formatCurrency(totals.netPayout)}</span>
        </div>
        {wht > 0 && (
          <p className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Withholding tax of {formatCurrency(wht)} is withheld from the manager&apos;s fee and
              remitted to the tax authority. It is not deducted from your payout.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
