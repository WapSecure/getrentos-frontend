'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { getFinancingPlanOptions } from '@/lib/financing';
import type { FinancingPlanLength } from '@/types/financing';

interface ApplyFinancingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentAmount: number;
  onSubmit: (months: FinancingPlanLength) => void;
}

export const ApplyFinancingModal = ({
  open,
  onOpenChange,
  rentAmount,
  onSubmit,
}: ApplyFinancingModalProps) => {
  const [step, setStep] = useState<'select' | 'review'>('select');
  const [selectedMonths, setSelectedMonths] = useState<FinancingPlanLength>(6);
  const [agreed, setAgreed] = useState(false);

  const options = getFinancingPlanOptions(rentAmount);
  const selectedOption = options.find((o) => o.months === selectedMonths)!;

  const handleClose = (next: boolean) => {
    if (!next) {
      setStep('select');
      setAgreed(false);
    }
    onOpenChange(next);
  };

  const handleSubmit = () => {
    onSubmit(selectedMonths);
    setStep('select');
    setAgreed(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <div className="p-4 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">
            {step === 'select' ? 'Choose Your Plan' : 'Review & Confirm'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {step === 'select'
              ? `We'll pay your landlord ${formatCurrency(rentAmount, { compact: true })} today`
              : 'Confirm your repayment terms'}
          </DialogDescription>
        </div>

        {step === 'select' ? (
          <div className="p-4 space-y-3">
            {options.map((option) => (
              <button
                key={option.months}
                onClick={() => setSelectedMonths(option.months)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  selectedMonths === option.months
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{option.months} months</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.feePercent}% service fee
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(option.monthlyInstallment, { compact: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>
              </button>
            ))}

            <Button variant="primary" fullWidth onClick={() => setStep('review')}>
              Continue
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              <SummaryRow
                label="Landlord receives today"
                value={formatCurrency(rentAmount, { compact: true })}
              />
              <SummaryRow label="Repayment term" value={`${selectedOption.months} months`} />
              <SummaryRow label="Service fee" value={`${selectedOption.feePercent}%`} />
              <SummaryRow
                label="Total repayable"
                value={formatCurrency(selectedOption.totalRepayable, { compact: true })}
              />
              <SummaryRow
                label="Monthly installment"
                value={formatCurrency(selectedOption.monthlyInstallment, { compact: true })}
                emphasis
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent">
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your rent is held in escrow like any other GetRentos payment — financing just
                changes who fronts the cash and when your landlord gets paid.
              </p>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <LegacyInput
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">
                I agree to repay {formatCurrency(selectedOption.totalRepayable, { compact: true })}{' '}
                over {selectedOption.months} monthly installments of{' '}
                {formatCurrency(selectedOption.monthlyInstallment, { compact: true })}.
              </span>
            </label>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1 gap-1.5"
                onClick={handleSubmit}
                disabled={!agreed}
              >
                <Zap className="w-3.5 h-3.5" />
                Submit Application
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const SummaryRow = ({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) => (
  <div className="flex items-center justify-between px-3 py-2.5 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={emphasis ? 'font-bold text-primary' : 'font-medium text-foreground'}>
      {value}
    </span>
  </div>
);
