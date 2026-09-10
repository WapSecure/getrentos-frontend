'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { usePlanPricing } from '@/hooks/usePlanPricing';
import { PlanComparisonTable } from '@/components/shared/subscription/PlanComparisonTable';
import { ProPriceCard } from '@/components/shared/subscription/ProPriceCard';
import type { PlanPersona } from '@/services/subscriptionService';

const PERSONAS: { key: PlanPersona; label: string }[] = [
  { key: 'landlord', label: 'Landlords' },
  { key: 'estate', label: 'Estate managers' },
  { key: 'owner', label: 'Property owners' },
  { key: 'realtor', label: 'Realtors' },
];

/**
 * Public pricing page — the surface prospective customers see before signing
 * up. Price and entitlements come from the backend catalog so what we show is
 * exactly what we charge.
 */
export default function PricingPage() {
  const router = useRouter();
  const { pricing, entitlementsFor, isLoading } = usePlanPricing();
  const [persona, setPersona] = useState<PlanPersona>('landlord');

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            <Sparkles className="h-3 w-3" /> Pricing
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
            Simple pricing that scales with you
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start free. Upgrade to Pro when you need unlimited scale, automation and analytics —
            with a {pricing?.trialDays ?? 14}-day free trial.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-md">
          <ProPriceCard pricing={pricing} onUpgrade={() => router.push('/signup')} />
        </div>

        <div className="mt-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Compare Free and Pro</h2>
            <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1 text-sm">
              {PERSONAS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPersona(p.key)}
                  className={
                    persona === p.key
                      ? 'rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground'
                      : 'rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary'
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
          ) : (
            <PlanComparisonTable rows={entitlementsFor(persona)} />
          )}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Cancel anytime', body: 'No lock-in. Downgrade to Free whenever you like.' },
            {
              title: 'VAT included',
              body: 'The price you see is exactly what you pay — no surprises at checkout.',
            },
            {
              title: 'Secure payments',
              body: 'Powered by Paystack. Your card is only charged after the trial ends.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-medium text-foreground">{f.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground"
          >
            Get started free
          </Link>
        </div>
      </div>
    </div>
  );
}
