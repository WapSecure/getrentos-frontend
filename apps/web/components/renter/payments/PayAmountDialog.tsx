'use client';

import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  CurrencyInput,
  DescriptionList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  RadioGroup,
} from '@getrentos/ui';
import { PaymentProviderPicker } from '@/components/shared/payments/PaymentProviderPicker';
import { useCheckoutFee } from '@/hooks/useCheckoutFee';
import type { PaymentProviderChoice } from '@/hooks/usePaymentProviders';
import { formatCurrency } from '@/lib/format';

/** Matches the backend: the smallest part-payment accepted. */
const MIN_PART_PAYMENT = 1_000;

interface PayAmountDialogProps {
  /** The charge being paid, or null when closed. */
  payment: {
    propertyName: string;
    owed: number;
    dueDate?: string | null;
    overdue?: boolean;
  } | null;
  onClose: () => void;
  onPay: (amount: number | undefined) => void;
  /** Which company takes the payment (Paystack or Monnify). */
  providers: PaymentProviderChoice;
  /** Why the last try failed when the chosen company could not take it: choose another. */
  providerError?: string | null;
}

const lagosDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** A small numbered heading for each step of the dialog. */
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] text-foreground">
        {n}
      </span>
      {children}
    </p>
  );
}

/**
 * Pay what a charge owes, or part of it: choose how much, choose who takes
 * the payment, see exactly what will be charged, then go to that company's
 * secure page. Anything paid goes to this charge first.
 */
export const PayAmountDialog = ({
  payment,
  onClose,
  onPay,
  providers,
  providerError,
}: PayAmountDialogProps) => {
  const [mode, setMode] = useState<'full' | 'part'>('full');
  const [amount, setAmount] = useState('');

  const close = () => {
    setMode('full');
    setAmount('');
    onClose();
  };

  const owed = payment?.owed ?? 0;
  const part = Number(amount);
  const minPart = Math.min(MIN_PART_PAYMENT, owed);
  const partValid = part >= minPart && part < owed;
  // Only once something is typed: an empty box is not yet a mistake.
  const partError =
    mode !== 'part' || !amount
      ? undefined
      : part < minPart
        ? `Enter at least ${formatCurrency(minPart)}.`
        : part >= owed
          ? `You owe ${formatCurrency(owed)} on this charge. To pay all of it, choose Pay in full.`
          : undefined;
  const paying = mode === 'full' ? owed : partValid ? part : 0;
  // The payer covers the card or bank fee, so the landlord gets the full amount.
  const { fee, total } = useCheckoutFee(paying, providers.provider);
  const chosen = providers.options.find((o) => o.provider === providers.provider);
  const ready = mode === 'full' || partValid;
  const steps = providers.canChoose;

  return (
    <Dialog open={!!payment} onOpenChange={(open) => !open && close()}>
      <DialogContent className="p-0 sm:p-0 sm:max-w-lg">
        <div className="border-b border-border p-5 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg font-semibold text-foreground">Pay rent</DialogTitle>
            {payment?.overdue && <Badge variant="danger">Overdue</Badge>}
          </div>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {payment?.propertyName}
            {payment?.dueDate ? ` · due ${lagosDate(payment.dueDate)}` : ''}
          </DialogDescription>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {formatCurrency(owed)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">owed</span>
          </p>
        </div>

        <div className="space-y-5 p-5">
          <div className="space-y-2.5">
            {steps && <Step n={1}>How much</Step>}
            <RadioGroup
              aria-label="How much to pay"
              variant="card"
              columns={2}
              value={mode}
              onValueChange={setMode}
              options={[
                { value: 'full', label: 'Pay in full', description: formatCurrency(owed) },
                { value: 'part', label: 'Pay part', description: 'Choose an amount' },
              ]}
            />
            {mode === 'part' && (
              <Field
                label="Amount"
                hint={`At least ${formatCurrency(minPart)}. The rest stays owed on this charge. The first rent on a new lease has to be paid in full.`}
                error={partError}
              >
                <CurrencyInput
                  prefix="₦"
                  value={amount}
                  onValueChange={(v) => setAmount(v === 0 ? '' : String(v))}
                />
              </Field>
            )}
          </div>

          {steps && (
            <div className="space-y-2.5">
              <Step n={2}>Pay with</Step>
              {providerError && <Alert variant="warning">{providerError}</Alert>}
              <PaymentProviderPicker choice={providers} variant="card" hideLabel />
            </div>
          )}
          {!steps && providerError && <Alert variant="warning">{providerError}</Alert>}

          {ready && paying > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-1">
              <DescriptionList
                layout="rows"
                items={[
                  {
                    label: mode === 'full' ? 'Rent' : 'Part payment',
                    value: formatCurrency(paying),
                  },
                  {
                    label: 'Card or bank fee',
                    value: fee == null ? '…' : fee > 0 ? formatCurrency(fee) : 'None',
                  },
                  {
                    label: <span className="font-medium text-foreground">You pay</span>,
                    value: <span className="text-base">{formatCurrency(total ?? paying)}</span>,
                  },
                ]}
              />
              {fee ? (
                <p className="border-t border-border py-2.5 text-xs text-muted-foreground">
                  The fee goes to the payment company, so your landlord receives the full{' '}
                  {formatCurrency(paying)}.
                </p>
              ) : null}
            </div>
          )}

          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              disabled={!ready}
              onClick={() => {
                onPay(mode === 'part' ? part : undefined);
                close();
              }}
            >
              <Lock className="h-4 w-4" />
              {ready
                ? `Pay ${formatCurrency(total ?? paying)}${chosen && steps ? ` with ${chosen.label}` : ''}`
                : 'Enter an amount to pay'}
            </Button>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>
                You finish on {chosen?.label ?? 'the payment company'}’s secure page: GetRentos
                never sees your card details. Your rent is held by GetRentos until you confirm
                move-in.
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
