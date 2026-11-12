'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SegmentedControl, TableSkeleton, type Segment } from '@sureground/ui';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { usePlanPricing } from '@/hooks/usePlanPricing';
import { PlanComparisonTable } from '@/components/shared/subscription/PlanComparisonTable';
import { ProPriceCard } from '@/components/shared/subscription/ProPriceCard';
import { ROUTES } from '@/lib/constants/auth';
import type { PlanPersona } from '@/services/subscriptionService';

const PERSONAS: Segment<PlanPersona>[] = [
  { value: 'landlord', label: 'Landlords' },
  { value: 'estate', label: 'Estate managers' },
  { value: 'owner', label: 'Property owners' },
  { value: 'realtor', label: 'Realtors' },
];

export default function PricingPage() {
  const router = useRouter();
  const { pricing, entitlementsFor, isLoading } = usePlanPricing();
  const [persona, setPersona] = useState<PlanPersona>('landlord');

  // Each fact follows the pricing the API returns, so the page never promises a term we don't offer.
  const facts = [
    {
      title: 'Cancel anytime',
      body: 'No lock-in. Move back to Free from your account whenever you like.',
    },
    pricing
      ? pricing.vatInclusive
        ? { title: 'VAT included', body: 'The price shown is the price you pay at checkout.' }
        : { title: 'VAT at checkout', body: 'VAT is added at checkout and shown before you pay.' }
      : null,
    {
      title: 'Payments by Paystack',
      body: 'Your Pro charge starts only when the free trial ends.',
    },
  ].filter((fact): fact is { title: string; body: string } => fact !== null);

  return (
    <>
      <section aria-labelledby="page-title" className="pt-24 pb-16 md:pt-32 md:pb-24">
        <Container className="grid items-start gap-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16">
          <div className="hero-rise">
            <p className="label-caps mb-5 text-muted-foreground">Pricing</p>
            <h1
              id="page-title"
              className="text-[2.5rem] leading-[1.04] font-light tracking-[-0.02em] text-balance sm:text-[3.25rem] lg:text-[4rem]"
            >
              Start free. Upgrade when the work grows.
            </h1>
            <p className="mt-6 max-w-[48ch] text-base leading-relaxed text-muted-foreground md:text-[1.0625rem]">
              Free covers the essentials. Pro adds unlimited scale, automation and analytics
              {pricing ? `, with a ${pricing.trialDays}-day free trial` : ''}.
            </p>
            <ul className="mt-10 flex flex-col border-t border-border">
              {facts.map((fact) => (
                <li
                  key={fact.title}
                  className="grid gap-1 border-b border-border py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6"
                >
                  <span className="font-medium text-foreground">{fact.title}</span>
                  <span className="text-[0.9375rem] text-muted-foreground">{fact.body}</span>
                </li>
              ))}
            </ul>
          </div>
          <ProPriceCard pricing={pricing} onUpgrade={() => router.push(ROUTES.SIGNUP)} />
        </Container>
      </section>

      <section
        aria-labelledby="pricing-compare"
        className="border-y border-border bg-card py-20 md:py-28"
      >
        <Container>
          <SectionIntro
            id="pricing-compare"
            eyebrow="Compare plans"
            title="What Free and Pro include"
            lead="Plans differ by role. Choose yours to see the limits that apply to you."
            action={
              <SegmentedControl
                aria-label="Plan audience"
                value={persona}
                onValueChange={setPersona}
                segments={PERSONAS}
                className="flex flex-wrap"
              />
            }
          />
          {isLoading ? (
            <TableSkeleton rows={6} columns={3} />
          ) : (
            <PlanComparisonTable rows={entitlementsFor(persona)} />
          )}
        </Container>
      </section>

      <ClosingBand
        title="Set up your account in a few minutes"
        lead="Every account starts on Free. You choose if and when to start the Pro trial."
        actions={
          <>
            <CtaLink href={ROUTES.SIGNUP} variant="light" arrow>
              Get started free
            </CtaLink>
            <CtaLink href={ROUTES.LOGIN} variant="outline-light">
              Sign in
            </CtaLink>
          </>
        }
      />
    </>
  );
}
