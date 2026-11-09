'use client';

import type { ReactNode } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  DescriptionList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@getrentos/ui';
import { PaymentProviderPicker } from '@/components/shared/payments/PaymentProviderPicker';
import { useCheckoutFee } from '@/hooks/useCheckoutFee';
import type { PaymentProviderChoice } from '@/hooks/usePaymentProviders';
import { formatCurrency } from '@/lib/format';
import { transferNote } from '@/lib/paymentCopy';

export interface PayDialogProps {
  open: boolean;
  onClose: () => void;
  /** "Pay rent", "Pay instalment", "Pay dues"… */
  title: string;
  /** What is being paid for: a property, a booking, an estate. "· due <date>" is added after it. */
  context?: ReactNode;
  /** Shown as "due 7 November 2026", in Lagos time. */
  dueDate?: string | null;
  overdue?: boolean;
  /** The large amount in the header. */
  owed: number;
  /** The small word after it. Defaults to "owed". */
  owedLabel?: string;
  /** What is paid now, before the fee. Defaults to `owed`; 0 means not ready (an amount still to enter). */
  amount?: number;
  /** The breakdown's first row: "Rent", "Instalment", "Dues", "Deposit", "Stay"… */
  itemLabel: string;
  /**
   * When what is paid is made of separate amounts (a land payment and its late
   * fee), the rows that add up to it, shown in place of the single item row.
   */
  itemParts?: { label: string; amount: number }[];
  /** One line under the breakdown, shown when there is a fee: who receives the full amount. */
  receiverLine: ReactNode;
  /** The flow's own protection sentence, after the secure-page reassurance. */
  protection: ReactNode;
  /** The "How much" step, for flows that allow paying part. */
  amountStep?: ReactNode;
  providers: PaymentProviderChoice;
  /** Why the last try failed when the chosen company could not take it: choose another. */
  providerError?: string | null;
  /** Why the last try failed for any other reason, shown above the button. */
  error?: string | null;
  onPay: () => void;
  busy?: boolean;
  /** The button when `amount` is 0. */
  notReadyLabel?: string;
  /**
   * When the card is only charged for a shortfall (a vendor invoice paid from
   * held rent first): no fee or total row is added, `itemParts` may show the
   * split, this note says when a card top-up is taken, and the button reads
   * `buttonLabel`. `disabled` holds the button (the split is still being worked
   * out, or it cannot be paid); `secureLine` replaces the secure-page sentence
   * once it is known whether a card is needed at all.
   */
  topUpOnly?: {
    note: ReactNode;
    buttonLabel: string;
    disabled?: boolean;
    secureLine?: ReactNode;
  };
}

const lagosDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** A small heading for each step of the dialog, numbered only when there is more than one. */
function Step({ n, children }: { n?: number; children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {n !== undefined && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] text-foreground">
          {n}
        </span>
      )}
      {children}
    </p>
  );
}

/**
 * The one way to pay anything on GetRentos: what is owed, (how much,) who
 * takes the payment, exactly what will be charged, then that company's secure
 * page. Each flow brings its own words; the layout is the same everywhere.
 */
export const PayDialog = ({
  open,
  onClose,
  title,
  context,
  dueDate,
  overdue,
  owed,
  owedLabel = 'owed',
  amount,
  itemLabel,
  itemParts,
  receiverLine,
  protection,
  amountStep,
  providers,
  providerError,
  error,
  onPay,
  busy,
  notReadyLabel = 'Enter an amount to pay',
  topUpOnly,
}: PayDialogProps) => {
  const paying = amount ?? owed;
  const ready = paying > 0;
  // The payer covers the card or bank fee, so whoever is paid gets the full amount.
  const {
    fee,
    total,
    state: feeState,
    retry: retryFee,
    retrying: retryingFee,
  } = useCheckoutFee(topUpOnly ? 0 : paying, providers.provider);
  const chosen = providers.options.find((o) => o.provider === providers.provider);
  const steps = providers.canChoose;
  const company = chosen?.label ?? 'the payment company';
  // Never promise a total that leaves the fee out: wait for it, or say it comes next.
  const feeLoading = !topUpOnly && ready && feeState === 'loading';
  const feeUnknown = !topUpOnly && ready && feeState === 'unknown';
  const itemRows =
    itemParts && itemParts.length > 0
      ? itemParts.map((part) => ({ label: part.label, value: formatCurrency(part.amount) }))
      : [{ label: itemLabel, value: formatCurrency(paying) }];
  const howTransfer = transferNote(
    providers.provider,
    topUpOnly || total == null ? null : formatCurrency(total)
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="p-0 sm:p-0 sm:max-w-lg">
        <div className="border-b border-border p-5 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
            {overdue && <Badge variant="danger">Overdue</Badge>}
          </div>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {context}
            {dueDate ? `${context ? ' · ' : ''}due ${lagosDate(dueDate)}` : ''}
          </DialogDescription>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {formatCurrency(owed)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">{owedLabel}</span>
          </p>
        </div>

        <div className="space-y-5 p-5">
          {amountStep && (
            <div className="space-y-2.5">
              {steps && <Step n={1}>How much</Step>}
              {amountStep}
            </div>
          )}

          {steps && (
            <div className="space-y-2.5">
              <Step n={amountStep ? 2 : undefined}>Pay with</Step>
              {providerError && <Alert variant="warning">{providerError}</Alert>}
              <PaymentProviderPicker choice={providers} variant="card" hideLabel disabled={busy} />
              {ready && <p className="text-xs text-muted-foreground">{howTransfer}</p>}
            </div>
          )}
          {!steps && providerError && <Alert variant="warning">{providerError}</Alert>}
          {!steps && ready && <p className="text-xs text-muted-foreground">{howTransfer}</p>}

          {ready && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-1">
              <DescriptionList
                layout="rows"
                items={
                  topUpOnly
                    ? itemRows
                    : [
                        ...itemRows,
                        {
                          label: 'Card or bank fee',
                          value: feeUnknown ? (
                            'Shown on the next page'
                          ) : fee == null ? (
                            <span aria-label="Working out the fee">Working it out…</span>
                          ) : fee > 0 ? (
                            formatCurrency(fee)
                          ) : (
                            'None'
                          ),
                        },
                        {
                          label: <span className="font-medium text-foreground">You pay</span>,
                          value: (
                            <span className="text-base" aria-live="polite" aria-atomic="true">
                              {total != null
                                ? formatCurrency(total)
                                : `${formatCurrency(paying)} plus the fee`}
                            </span>
                          ),
                        },
                      ]
                }
              />
              {topUpOnly ? (
                <p className="border-t border-border py-2.5 text-xs text-muted-foreground">
                  {topUpOnly.note}
                </p>
              ) : fee ? (
                <p className="border-t border-border py-2.5 text-xs text-muted-foreground">
                  {receiverLine}
                </p>
              ) : null}
            </div>
          )}

          {feeUnknown && (
            <Alert
              variant="warning"
              action={
                retryFee ? (
                  <Button variant="outline" size="sm" onClick={retryFee} isLoading={retryingFee}>
                    Try again
                  </Button>
                ) : undefined
              }
            >
              We couldn’t work out the card or bank fee here. You’ll see it on {company}’s page
              before you pay.
            </Alert>
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              disabled={!ready || feeLoading || !!topUpOnly?.disabled}
              isLoading={busy || feeLoading}
              loadingText={!busy && feeLoading ? 'Working out the fee…' : undefined}
              onClick={onPay}
            >
              <Lock className="h-4 w-4" />
              {!ready
                ? notReadyLabel
                : topUpOnly
                  ? topUpOnly.buttonLabel
                  : feeUnknown
                    ? `Continue to ${company}`
                    : `Pay ${formatCurrency(total ?? paying)}${chosen && steps ? ` with ${chosen.label}` : ''}`}
            </Button>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>
                {topUpOnly?.secureLine ?? (
                  <>
                    {topUpOnly ? 'If a top-up is needed, you finish' : 'You finish'} on {company}’s
                    secure page: GetRentos never sees your card details.
                  </>
                )}{' '}
                {protection}
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
