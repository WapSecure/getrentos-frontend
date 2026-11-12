import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { ArrowLink } from '@/components/marketing/ArrowLink';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { FaqList, type Faq } from '@/components/marketing/FaqList';
import { FeatureRow } from '@/components/marketing/FeatureRow';
import { LandingHero } from '@/components/marketing/LandingHero';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { StepList } from '@/components/marketing/StepList';
import { photos } from '@/components/marketing/photos';
import { ROUTES } from '@/lib/constants/auth';

export const metadata: Metadata = {
  title: 'Sell Your Property in Nigeria',
  description:
    'List a home or land for sale on Sureground. Verify ownership once, handle viewings and offers in one place, and receive the buyer’s deposit through Sureground Payment Protection.',
  alternates: { canonical: '/sell' },
  openGraph: {
    title: 'Sell your property on Sureground',
    description: 'Verified ownership, managed viewings and offers, and a protected deposit.',
    url: '/sell',
    type: 'website',
  },
};

const STEPS = [
  {
    title: 'Verify ownership',
    body: 'Upload your title documents. Our team reviews them before your listing shows as verified.',
  },
  {
    title: 'List the property',
    body: 'Add photos, a floor plan and a video tour, set your asking price and publish.',
  },
  {
    title: 'Viewings and offers',
    body: 'Accept viewing requests and respond to offers from your dashboard, with every message in one thread.',
  },
  {
    title: 'A protected deposit',
    body: 'The buyer pays the deposit to Sureground. It is released to you once they confirm receipt.',
  },
];

const FAQ: Faq[] = [
  {
    q: 'Do I have to verify before I list?',
    a: 'Your identity is checked before you publish. The property shows as verified only after our team has reviewed its ownership or title documents, so buyers can tell the difference.',
  },
  {
    q: 'Which documents prove ownership?',
    a: 'Usually a Certificate of Occupancy, a Governor’s Consent or a registered deed of assignment, with a survey plan for land. Upload what you have and we will tell you if anything is missing.',
  },
  {
    q: 'When do I receive the money?',
    a: 'The buyer’s deposit is held by Sureground and released to you once they confirm receipt of the property and documents. If they raise a dispute, it stays held while it is resolved.',
  },
  {
    q: 'What does it cost?',
    a: (
      <>
        See{' '}
        <Link href={ROUTES.PRICING} className="text-foreground underline underline-offset-4">
          Pricing
        </Link>{' '}
        for current plans and fees.
      </>
    ),
  },
];

export default function SellPage() {
  return (
    <>
      <Navigation />
      <main id="main" className="bg-background">
        <LandingHero
          eyebrow="For property owners"
          title="Sell to buyers you can check"
          lead="List your home or land, verify ownership once, and handle viewings, offers and the deposit in one place."
          photo={photos.villaWhitePool}
          actions={
            <>
              <CtaLink href={ROUTES.SIGNUP} arrow>
                List your property
              </CtaLink>
              <CtaLink href="/buy" variant="outline">
                See homes for sale
              </CtaLink>
            </>
          }
        />

        <section
          aria-labelledby="sell-steps"
          className="border-y border-border bg-card py-20 md:py-28"
        >
          <Container>
            <SectionIntro
              id="sell-steps"
              eyebrow="How selling works"
              title="From listing to handover"
              lead="Four steps, each recorded in your dashboard so you and the buyer can see where things stand."
            />
            <StepList steps={STEPS} />
          </Container>
        </section>

        <section aria-label="Working with others" className="py-20 md:py-28">
          <Container className="flex flex-col gap-20 md:gap-28">
            <FeatureRow
              eyebrow="Realtors"
              title="Work with a realtor, on your terms"
              photo={photos.houseDarkFacade}
              action={<ArrowLink href="/agents">For realtors and agencies</ArrowLink>}
            >
              <p>
                Give a realtor access to market your property and take it back whenever you choose.
                You see every viewing and offer they handle.
              </p>
            </FeatureRow>
            <FeatureRow
              eyebrow="Buyers"
              title="Know who is making the offer"
              photo={photos.livingRoomWhite}
              reverse
            >
              <p>
                Buyers verify their identity before they make an offer or pay, and their deposit
                sits with Sureground, not with you or an agent, until the sale completes.
              </p>
            </FeatureRow>
          </Container>
        </section>

        <FaqList items={FAQ} name="sell-faq" title="Selling questions" />

        <ClosingBand
          title="Ready to list your property?"
          lead="Create a free account, verify your identity and add your first listing."
          actions={
            <>
              <CtaLink href={ROUTES.SIGNUP} variant="light" arrow>
                List your property
              </CtaLink>
              <CtaLink href={ROUTES.PRICING} variant="outline-light">
                See pricing
              </CtaLink>
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
