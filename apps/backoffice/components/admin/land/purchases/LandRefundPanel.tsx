'use client';

import { useState } from 'react';
import { CircleCheck, CircleAlert, HandCoins, Loader2, RotateCcw } from 'lucide-react';
import { Button, ConfirmDialog, CurrencyInput, Field } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import type { LandPurchaseDetail, LandRefundStatus } from '@/types/landPurchase';

const STATUS_COPY: Record<
  LandRefundStatus,
  { title: string; body: string; tone: 'ok' | 'wait' | 'act' }
> = {
  PENDING: {
    title: 'Refund queued',
    body: 'It will be sent through Paystack against the buyer’s own payments.',
    tone: 'wait',
  },
  PROCESSING: {
    title: 'Refund in progress',
    body: 'Paystack is being asked to return it now.',
    tone: 'wait',
  },
  REFUNDED: {
    title: 'Refunded through Paystack',
    body: 'Everything owed went back to the card or account the buyer paid with.',
    tone: 'ok',
  },
  FAILED: {
    title: 'Refund attempt failed',
    body: 'The hourly sweep retries it automatically; you can retry now.',
    tone: 'act',
  },
  NEEDS_MANUAL: {
    title: 'Finance must finish this refund',
    body: 'Part of it could not go back automatically — the money was already released to the developer, or Paystack kept refusing. Pay the rest by hand, then record it here.',
    tone: 'act',
  },
  SETTLED_MANUALLY: {
    title: 'Settled by finance',
    body: 'The remainder was recorded as paid outside Paystack.',
    tone: 'ok',
  },
};

interface LandRefundPanelProps {
  purchase: LandPurchaseDetail;
  canAct: boolean;
  retrying: boolean;
  settling: boolean;
  onRetry: () => void;
  onSettle: (amount: number, note: string) => Promise<unknown>;
}

/**
 * Where a terminated purchase's refund stands, and the two things finance can
 * do about it. Refunds normally go back on their own; this panel exists for
 * the share that cannot (escrow already paid the developer) or that the
 * gateway refused.
 */
export const LandRefundPanel = ({
  purchase,
  canAct,
  retrying,
  settling,
  onRetry,
  onSettle,
}: LandRefundPanelProps) => {
  const due = purchase.refundDue ?? 0;
  const refunded = purchase.refundedAmount ?? 0;
  const owed = Math.max(0, due - refunded);
  const status = purchase.refundStatus;
  const copy = status ? STATUS_COPY[status] : null;
  const actionable = status === 'FAILED' || status === 'NEEDS_MANUAL';

  const [amount, setAmount] = useState(String(owed));
  const [note, setNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const parsed = Number(amount);
  const amountValid = Number.isInteger(parsed) && parsed >= 1 && parsed <= owed;

  const Icon =
    copy?.tone === 'ok'
      ? CircleCheck
      : copy?.tone === 'act'
        ? CircleAlert
        : status
          ? Loader2
          : HandCoins;
  const tone =
    copy?.tone === 'ok'
      ? 'border-success/30 bg-success/5'
      : copy?.tone === 'act'
        ? 'border-warning/40 bg-warning-subtle'
        : 'border-border bg-card';

  return (
    <div className={`rounded-2xl border p-4 text-sm ${tone}`}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            {copy?.title ?? (due > 0 ? 'Refund due to the buyer' : 'Nothing to refund')}
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Owed {formatCurrency(due)} · returned {formatCurrency(refunded)}
            {owed > 0 && ` · still owed ${formatCurrency(owed)}`}
            {purchase.refundSettledAt && ` · settled ${formatDate(purchase.refundSettledAt)}`}
          </p>
          {copy && <p className="mt-1 text-muted-foreground">{copy.body}</p>}

          {actionable && canAct && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <Button
                variant="outline"
                size="sm"
                isLoading={retrying}
                onClick={onRetry}
                icon={<RotateCcw className="h-4 w-4" />}
              >
                Retry through Paystack
              </Button>
              {owed > 0 && (
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
                  <Field
                    label={`Paid back by hand (up to ${formatCurrency(owed)})`}
                    className="flex-1"
                  >
                    <CurrencyInput
                      prefix="₦"
                      value={amount}
                      onValueChange={(value) => setAmount(value ? String(value) : '')}
                      invalid={!amountValid}
                    />
                  </Field>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!amountValid}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Record manual settlement
                  </Button>
                </div>
              )}
            </div>
          )}
          {actionable && !canAct && (
            <p className="mt-2 text-xs text-muted-foreground">
              Retrying or settling a refund needs the escrow approval permission.
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Record a manual refund"
        description={`Record ${formatCurrency(amountValid ? parsed : 0)} as paid back to the buyer outside Paystack. The buyer is notified. This cannot be undone.`}
        confirmLabel="Record settlement"
        isLoading={settling}
        promptLabel="How it was paid"
        promptPlaceholder="e.g. Bank transfer TRF-20261013-0042"
        promptValue={note}
        onPromptChange={setNote}
        promptRequired
        promptMinLength={5}
        onConfirm={async () => {
          await onSettle(parsed, note);
          setConfirmOpen(false);
          setNote('');
        }}
      />
    </div>
  );
};
