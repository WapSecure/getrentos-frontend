'use client';

import { useState } from 'react';
import { TrendingUp, ShieldCheck, Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CreditBureau } from '@/types/credit-reporting';

interface CreditReportingOptInProps {
  onEnroll: () => void;
  isEnrolling: boolean;
}

const bureaus: CreditBureau[] = [
  'CRC Credit Bureau',
  'FirstCentral Credit Bureau',
  'XDS Credit Bureau',
];

const benefits = [
  {
    icon: TrendingUp,
    title: 'Rent counts toward your credit history',
    description: 'Most renters get zero credit for years of on-time rent. We change that.',
  },
  {
    icon: Building2,
    title: 'Reported to all three bureaus',
    description: 'Your payment history is shared with every licensed credit bureau in Nigeria.',
  },
  {
    icon: ShieldCheck,
    title: 'Only positive history is shared',
    description: 'We report your on-time payment streak — this never lowers your existing score.',
  },
];

export const CreditReportingOptIn = ({ onEnroll, isEnrolling }: CreditReportingOptInProps) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 bg-accent">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Credit Building
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Turn your rent into a credit history
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">
            Paying rent on time is proof you pay your bills — but it has never counted toward your
            credit score. GetRentos reports your on-time rent payments to Nigeria&apos;s credit
            bureaus so it finally does.
          </p>
        </div>

        <div className="p-6">
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                  <benefit.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{benefit.title}</p>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border p-4 mb-4">
            <p className="text-xs font-medium text-foreground mb-3">Reporting to</p>
            <div className="flex flex-wrap gap-2">
              {bureaus.map((bureau) => (
                <span
                  key={bureau}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground"
                >
                  <Building2 className="w-3 h-3" />
                  {bureau}
                </span>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">
              I consent to GetRentos reporting my monthly rent and Flex installment payment history
              to CRC Credit Bureau, FirstCentral Credit Bureau, and XDS Credit Bureau on an ongoing
              basis.
            </span>
          </label>

          <Button
            variant="primary"
            className="gap-2"
            onClick={onEnroll}
            disabled={!agreed || isEnrolling}
          >
            {isEnrolling ? (
              'Enrolling...'
            ) : (
              <>
                <Check className="w-4 h-4" />
                Start Reporting My Rent
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
