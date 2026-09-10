'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { TrendingUp, ShieldCheck, Building2, Check } from 'lucide-react';
import { Button } from '@getrentos/ui';
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
    description: 'Most renters get zero credit for years of on-time rent. We aim to change that.',
  },
  {
    icon: Building2,
    title: 'Built for Nigeria’s credit bureaus',
    description:
      'We’re integrating with licensed bureaus so your record is ready to submit the moment reporting goes live.',
  },
  {
    icon: ShieldCheck,
    title: 'Only positive history, ever',
    description:
      'Only your on-time payment streak is tracked — this can never lower an existing score.',
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
              Credit Building · Coming Soon
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Turn your rent into a credit history
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">
            Paying rent on time is proof you pay your bills — but it has never counted toward your
            credit score. Start tracking your on-time rent payments now, and we&apos;ll submit that
            history to Nigeria&apos;s credit bureaus as soon as reporting goes live.
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
            <p className="text-xs font-medium text-foreground mb-3">
              Bureau partners we&apos;re integrating with
            </p>
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
            <p className="text-xs text-muted-foreground mt-3">
              Live reporting to these bureaus hasn&apos;t launched yet — turning this on today only
              starts building your track record inside GetRentos.
            </p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer mb-4">
            <LegacyInput
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">
              I&apos;d like GetRentos to start tracking my on-time rent and Flex installment
              payments now, so my history is ready to submit to Nigeria&apos;s credit bureaus the
              moment that reporting goes live.
            </span>
          </label>

          <Button
            variant="primary"
            className="gap-2"
            onClick={onEnroll}
            disabled={!agreed || isEnrolling}
          >
            {isEnrolling ? (
              'Starting...'
            ) : (
              <>
                <Check className="w-4 h-4" />
                Start Building My Credit Record
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
