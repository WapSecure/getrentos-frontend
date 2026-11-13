'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SegmentedControl, type Segment } from '@sureground/ui/SegmentedControl';
import { TableSkeleton } from '@sureground/ui/Skeleton';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { usePlanPricing } from '@/hooks/usePlanPricing';
import { PlanComparisonTable } from '@/components/shared/subscription/PlanComparisonTable';
import { ProPriceCard } from '@/components/shared/subscription/ProPriceCard';
import { ROUTES, getUserRole } from '@/lib/constants/auth';
import { signedInPricingLinks } from '@/lib/pricingCta';
import { useAuthStore } from '@/lib/store/authStore';
import type { PlanPersona, PlanPricing } from '@/services/subscriptionService';
import { Eyebrow } from '@/components/marketing/Eyebrow';

const PERSONAS: Segment<PlanPersona>[] = [
  { value: 'landlord', label: 'Landlords' },
  { value: 'estate', label: 'Estate managers' },
  { value: 'owner', label: 'Property owners' },
  { value: 'realtor', label: 'Realtors' },
];

/** `initialPricing` comes from the server, so the price, trial and VAT lines are in the first HTML and nothing shifts. */
export function PricingView({ initialPricing }: { initialPricing?: PlanPricing }) {
  const router = useRouter();
  const { pricing, entitlementsFor, isLoading } = usePlanPricing(initialPricing);
  const [persona, setPersona] = useState<PlanPersona>('landlord');
  // Signed-in visitors go to their own workspace, not sign-up. The signed-in flag is set after
  // mount, so the server HTML and the first client render both show the signed-out actions.
  const isSignedIn = useAuthStore((s) => s.isAuthenticated);
  const [accountLinks] = useState(() =>
    typeof window === 'undefined' ? null : signedInPricingLinks(getUserRole())
  );
  useEffect(() => {
    useAuthStore.getState().init();
  }, []);
  const signedInLinks = isSignedIn ? accountLinks : null;

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
            <Eyebrow className="mb-5">Pricing</Eyebrow>
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
          <ProPriceCard
            pricing={pricing}
            onUpgrade={() =>
              router.push(
                signedInLinks ? (signedInLinks.billing ?? signedInLinks.dashboard) : ROUTES.SIGNUP
              )
            }
          />
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

      {signedInLinks ? (
        <ClosingBand
          title="Manage your plan from your account"
          lead={
            signedInLinks.billing
              ? 'Start the Pro trial or change your plan from billing in your workspace.'
              : 'Your plan and account settings are in your workspace.'
          }
          actions={
            <>
              {signedInLinks.billing && (
                <CtaLink href={signedInLinks.billing} variant="light" arrow>
                  Go to billing
                </CtaLink>
              )}
              <CtaLink
                href={signedInLinks.dashboard}
                variant={signedInLinks.billing ? 'outline-light' : 'light'}
                arrow={!signedInLinks.billing}
              >
                Go to your dashboard
              </CtaLink>
            </>
          }
        />
      ) : (
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
      )}
    </>
  );
}
