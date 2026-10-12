'use client';

import { useState } from 'react';
import { Button, ConfirmDialog } from '@getrentos/ui';
import { CreditCard, Download, FileText, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { landBuyerService } from '@/services/landBuyerService';
import {
  LAND_SALE_DOCUMENT_LABELS,
  type LandPurchaseDetail,
  type LandSaleDocumentKind,
} from '@/types/landBuyer';
import {
  CANCELLABLE_PURCHASE_STATUSES,
  PAYABLE_PURCHASE_STATUSES,
  bpsToPercent,
  refundPreview,
} from './landSaleLogic';

type Notify = (message: string, variant: 'success' | 'error') => void;

/** What is due now and the button that pays it. */
export const PayNextCard = ({
  purchase,
  onPay,
  isPaying,
}: {
  purchase: LandPurchaseDetail;
  onPay: () => void;
  isPaying: boolean;
}) => {
  const payable = PAYABLE_PURCHASE_STATUSES.includes(purchase.status) && purchase.nextDue;
  return (
    <section
      aria-labelledby="pay-heading"
      className={`rounded-2xl border p-5 ${
        purchase.nextDue?.overdue
          ? 'border-destructive/40 bg-destructive/5'
          : 'border-primary/20 bg-card'
      }`}
    >
      <h2 id="pay-heading" className="font-semibold text-foreground">
        {purchase.status === 'PENDING_DEPOSIT' ? 'Pay your deposit' : 'Next payment'}
      </h2>
      {payable && purchase.nextDue ? (
        <>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
            {formatCurrency(purchase.nextDue.amount)}
          </p>
          <p
            className={`mt-1 text-sm ${purchase.nextDue.overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}
          >
            {purchase.nextDue.label} · {purchase.nextDue.overdue ? 'was due' : 'due'}{' '}
            {formatDate(purchase.nextDue.dueDate)}
            {purchase.nextDue.overdue ? ' (late fee included)' : ''}
          </p>
          <Button
            className="mt-4"
            fullWidth
            icon={<CreditCard className="h-4 w-4" />}
            onClick={onPay}
            isLoading={isPaying}
            disabled={isPaying}
          >
            Pay {formatCurrency(purchase.nextDue.amount)}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            You will be taken to our payment partner to pay securely. The money is held in escrow.
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {purchase.status === 'PAID_IN_FULL' || purchase.status === 'COMPLETED'
            ? 'Paid in full. Nothing more is due.'
            : 'Nothing is payable on this purchase.'}
        </p>
      )}
    </section>
  );
};

/** The contract of sale and the letter of allocation, downloaded as PDFs. */
export const PurchaseDocuments = ({
  purchase,
  notify,
}: {
  purchase: LandPurchaseDetail;
  notify: Notify;
}) => {
  const [busy, setBusy] = useState<LandSaleDocumentKind | null>(null);
  const allocationReady = ['ACTIVE', 'PAID_IN_FULL', 'COMPLETED', 'DEFAULTED'].includes(
    purchase.status
  );
  const download = async (kind: LandSaleDocumentKind) => {
    setBusy(kind);
    const result = await landBuyerService.downloadDocument(purchase.id, kind, purchase.reference);
    setBusy(null);
    if (!result.success) notify(result.message || 'Could not download the document.', 'error');
  };
  return (
    <section
      aria-labelledby="docs-heading"
      className="rounded-2xl border border-border bg-card p-5"
    >
      <h2 id="docs-heading" className="flex items-center gap-2 font-semibold text-foreground">
        <FileText className="h-4 w-4 text-primary" aria-hidden /> Documents
      </h2>
      <ul className="mt-3 space-y-2">
        {(['contract-of-sale', 'allocation-letter'] as const).map((kind) => {
          const disabled = kind === 'allocation-letter' && !allocationReady;
          return (
            <li key={kind}>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                icon={<Download className="h-4 w-4" />}
                isLoading={busy === kind}
                disabled={disabled || busy !== null}
                onClick={() => download(kind)}
              >
                {LAND_SALE_DOCUMENT_LABELS[kind]} (PDF)
              </Button>
              {disabled && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Issued once the deposit is paid.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/**
 * Cancelling, with the refund it would produce spelled out first: what was
 * paid less the plan's forfeiture charge, late fees kept.
 */
export const CancelPurchaseCard = ({
  purchase,
  onCancel,
  isCancelling,
}: {
  purchase: LandPurchaseDetail;
  onCancel: (reason: string) => Promise<unknown>;
  isCancelling: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  if (!CANCELLABLE_PURCHASE_STATUSES.includes(purchase.status)) return null;
  const preview = refundPreview(purchase);

  const description =
    preview.principalPaid > 0
      ? `You have paid ${formatCurrency(preview.principalPaid)} towards the price. The plan keeps ${bpsToPercent(preview.chargeBps)} (${formatCurrency(preview.charge)}) as a forfeiture charge, so about ${formatCurrency(preview.refund)} would be refunded${preview.lateFeesPaid > 0 ? `; the ${formatCurrency(preview.lateFeesPaid)} paid in late fees is not refundable` : ''}. The plot goes back on sale and this cannot be undone.`
      : 'Nothing has been paid yet, so nothing is forfeited. The plot goes back on sale and this cannot be undone.';

  return (
    <section
      aria-labelledby="cancel-heading"
      className="rounded-2xl border border-border bg-card p-5"
    >
      <h2 id="cancel-heading" className="font-semibold text-foreground">
        Cancel purchase
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Refund if you cancel now:{' '}
        <span className="font-semibold text-foreground">{formatCurrency(preview.refund)}</span>
        {preview.charge > 0 && <> after a {formatCurrency(preview.charge)} forfeiture</>}. Late fees
        are not refunded.
      </p>
      <Button
        className="mt-3"
        variant="outline"
        size="sm"
        icon={<XCircle className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        Cancel this purchase
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setReason('');
        }}
        title="Cancel this purchase?"
        description={description}
        confirmLabel="Cancel purchase"
        isLoading={isCancelling}
        promptLabel="Why are you cancelling? (optional)"
        promptValue={reason}
        onPromptChange={setReason}
        onConfirm={() => onCancel(reason).catch(() => undefined)}
      />
    </section>
  );
};
