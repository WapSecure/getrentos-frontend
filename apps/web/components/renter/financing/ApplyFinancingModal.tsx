'use client';

import { useState } from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  RadioGroup,
} from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { getFinancingPlanOptions } from '@/lib/financing';
import type { FinancingPlanLength } from '@/types/financing';

interface ApplyFinancingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentAmount: number;
  onSubmit: (months: FinancingPlanLength) => void;
  isSubmitting?: boolean;
}

export const ApplyFinancingModal = ({
  open,
  onOpenChange,
  rentAmount,
  onSubmit,
  isSubmitting = false,
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
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0">
        <div className="p-4 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">
            {step === 'select' ? 'Choose Your Plan' : 'Review & Confirm'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {step === 'select'
              ? `GetRentos pays your landlord ${formatCurrency(rentAmount, { compact: true })}; you repay monthly`
              : 'Confirm your repayment terms'}
          </DialogDescription>
        </div>

        {step === 'select' ? (
          <div className="p-4 space-y-3">
            <RadioGroup
              variant="card"
              aria-label="Repayment plan"
              value={String(selectedMonths)}
              onValueChange={(value) => setSelectedMonths(Number(value) as FinancingPlanLength)}
              options={options.map((option) => ({
                value: String(option.months),
                label: `${option.months} months`,
                description: `${option.feePercent}% service fee`,
                aside: (
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(option.monthlyInstallment, { compact: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                ),
              }))}
            />

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
                GetRentos holds your rent like any other payment: financing just changes who fronts
                the cash and when your landlord gets paid.
              </p>
            </div>

            <Checkbox
              checked={agreed}
              onCheckedChange={setAgreed}
              label={
                <span className="text-xs text-muted-foreground">
                  I agree to repay{' '}
                  {formatCurrency(selectedOption.totalRepayable, { compact: true })} over{' '}
                  {selectedOption.months} monthly installments of{' '}
                  {formatCurrency(selectedOption.monthlyInstallment, { compact: true })}.
                </span>
              }
            />

            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setStep('select')}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSubmit}
                disabled={!agreed}
                isLoading={isSubmitting}
                icon={<Zap className="h-3.5 w-3.5" />}
              >
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
