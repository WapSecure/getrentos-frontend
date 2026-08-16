'use client';

import { Zap, ShieldCheck, Clock, TrendingUp, Lock } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { getFinancingPlanOptions, MIN_TRUST_SCORE_FOR_FINANCING } from '@/lib/financing';

interface FinancingEligibilityCardProps {
  rentAmount: number;
  trustScore: number;
  isPending: boolean;
  onApply: () => void;
}

const steps = [
  {
    icon: Zap,
    title: 'We pay your landlord today',
    description:
      'The full amount lands in escrow and releases to your landlord immediately — no waiting.',
  },
  {
    icon: Clock,
    title: 'You repay monthly',
    description: 'Spread the cost over 3, 6, or 12 months at a flat, transparent service fee.',
  },
  {
    icon: TrendingUp,
    title: 'Build your trust score',
    description:
      'On-time installments count toward your GetRentos Trust Score, just like rent payments.',
  },
];

export const FinancingEligibilityCard = ({
  rentAmount,
  trustScore,
  isPending,
  onApply,
}: FinancingEligibilityCardProps) => {
  const isEligible = trustScore >= MIN_TRUST_SCORE_FOR_FINANCING;
  const cheapestOption = getFinancingPlanOptions(rentAmount)[2];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 bg-accent">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              GetRentos Flex
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Stop scraping together a year of rent
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">
            Landlords in Nigeria often ask for 12 months upfront. GetRentos Flex pays them the full
            amount today, and you repay us in smaller monthly installments.
          </p>
        </div>

        <div className="p-6">
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {steps.map((step) => (
              <div key={step.title} className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                  <step.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Your current rent obligation</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(rentAmount, { compact: true })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                From as low as{' '}
                <span className="font-semibold text-primary">
                  {formatCurrency(cheapestOption.monthlyInstallment, { compact: true })}/mo
                </span>{' '}
                over {cheapestOption.months} months
              </p>
            </div>

            {isEligible ? (
              <Button variant="primary" className="gap-2" onClick={onApply} disabled={isPending}>
                <Zap className="w-4 h-4" />
                {isPending ? 'Reviewing Application...' : 'Apply for Flex'}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                Requires a trust score of {MIN_TRUST_SCORE_FOR_FINANCING}+
              </div>
            )}
          </div>

          {!isEligible && (
            <p className="text-xs text-muted-foreground mt-3">
              Your trust score is {trustScore}. Verify your identity and payment history to unlock
              Flex financing.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 p-4 rounded-xl bg-secondary">
        <ShieldCheck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          GetRentos Flex is not a loan against your future income — it&apos;s a rent-specific
          installment plan tied to your existing lease. Missed installments affect your Trust Score
          the same way a missed rent payment would.
        </p>
      </div>
    </div>
  );
};
