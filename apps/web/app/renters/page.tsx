import type { Metadata } from 'next';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { JsonLd } from '@/components/seo/JsonLd';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { FaqList } from '@/components/marketing/FaqList';
import { FeatureRow } from '@/components/marketing/FeatureRow';
import { LandingHero } from '@/components/marketing/LandingHero';
import { ListingStrip } from '@/components/marketing/ListingStrip';
import { RuledList } from '@/components/marketing/RuledList';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { StepList } from '@/components/marketing/StepList';
import { photos } from '@/components/marketing/photos';
import { faqJsonLd, type PlainFaq } from '@/lib/faqJsonLd';
import { ROUTES } from '@/lib/constants/auth';
import { SITE_OG_IMAGES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'For Renters: Find and Rent a Home in Nigeria',
  description:
    'Find a home to rent, see which listings and landlords are verified, apply online and pay rent through Sureground Payment Protection. Report repairs too.',
  alternates: { canonical: '/renters' },
  openGraph: {
    images: SITE_OG_IMAGES,
    title: 'Sureground for renters',
    description: 'Search, apply, sign and pay rent in one place, with your first rent protected.',
    url: '/renters',
    type: 'website',
  },
};

const STEPS = [
  {
    title: 'Search',
    body: 'Search by area, filter by price, bedrooms and type, or show verified listings only. Signed in, save a search to hear about new matches.',
  },
  {
    title: 'View the home',
    body: 'Ask to view in person or on a live video call, and see the time the landlord confirms.',
  },
  {
    title: 'Apply',
    body: 'Verify your identity once, then send your application with your income, references and documents.',
  },
  {
    title: 'Sign and pay',
    body: 'Sign the lease online and pay your first rent, which Sureground holds until you confirm move-in.',
  },
];

const CHECKS = [
  'How the price compares with similar homes on Sureground.',
  'Whether the listing and the landlord are verified.',
  'Anything worth asking the landlord about.',
  'A short list of what to do before you pay.',
];

const AFTER_MOVE_IN = [
  'Report a repair from your account, with photos, and follow it until it is resolved.',
  'See your lease, documents and inspections, and acknowledge the move-in inspection.',
  'Pay rent by card or bank transfer, in full or in part, and download receipts.',
  'See your security deposit, and dispute a deduction you do not agree with.',
];

const FAQ: PlainFaq[] = [
  {
    q: 'What does “verified” mean on a listing?',
    a: 'A verified listing is one where our team has reviewed the owner’s ownership documents. When you are signed in, each home also shows whether the landlord is verified. A check records what was reviewed on a date; it is not a guarantee of the property’s condition.',
  },
  {
    q: 'Why do I have to verify my identity to apply?',
    a: 'Landlords see who is applying, and verification is part of what they see. You verify once, and your details carry over to your next application.',
  },
  {
    q: 'What happens to my first rent?',
    a: 'On a new lease, Sureground holds your first rent under Sureground Payment Protection and releases it to your landlord when you confirm move-in, so report anything wrong with the home before then. Later rent is released on the date shown in your payments.',
  },
  {
    q: 'What if a charge looks wrong?',
    a: 'You can report a problem with a charge from your payments page, and our support team reviews it.',
  },
];

export default function RentersPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      <Navigation />
      <main id="main" className="bg-background">
        <LandingHero
          eyebrow="For renters"
          title="Rent a home you have checked"
          lead="Search homes to rent, see which listings and landlords are verified, apply online and pay your first rent with Sureground Payment Protection."
          photo={photos.livingRoomLight}
          actions={
            <>
              <CtaLink href="/rent" arrow>
                Find a home to rent
              </CtaLink>
              <CtaLink href={ROUTES.SIGNUP} variant="outline">
                Create an account
              </CtaLink>
            </>
          }
        />

        <section
          aria-labelledby="renter-steps"
          className="border-y border-border bg-card py-20 md:py-28"
        >
          <Container>
            <SectionIntro
              id="renter-steps"
              eyebrow="How renting works"
              title="From search to keys"
              lead="Your applications, viewings and payments are recorded in your account, so you can see where each one stands."
            />
            <StepList steps={STEPS} />
          </Container>
        </section>

        <section aria-label="Renting in detail" className="py-20 md:py-28">
          <Container className="flex flex-col gap-20 md:gap-28">
            <FeatureRow
              eyebrow="Before you apply"
              title="A check on each home"
              photo={photos.lagosResidential}
            >
              <p>Signed in, each home you open shows:</p>
              <RuledList items={CHECKS} className="mt-5" />
              <p className="pt-2 text-sm">It is a guide, not a guarantee.</p>
            </FeatureRow>
            <FeatureRow
              eyebrow="Your first rent"
              title="Held until you have the keys"
              photo={photos.livingRoomWhite}
              reverse
            >
              <p>
                Sureground holds your rent under Sureground Payment Protection. On a new lease it is
                released to your landlord when you confirm move-in; otherwise on the release date
                shown in your payments.
              </p>
              <p>Payment Protection is not insurance and does not guarantee the home.</p>
            </FeatureRow>
            <FeatureRow
              eyebrow="After move-in"
              title="Your home, in one account"
              photo={photos.diningKitchen}
            >
              <RuledList items={AFTER_MOVE_IN} />
            </FeatureRow>
          </Container>
        </section>

        <ListingStrip
          market="rent"
          id="renter-latest"
          title="Homes to rent now"
          href="/rent"
          cta="All homes to rent"
        />

        <FaqList items={FAQ} name="renter-faq" title="Renting questions" />

        <ClosingBand
          title="Start your search"
          lead="Browse without an account. Create one when you are ready to view or apply."
          actions={
            <>
              <CtaLink href="/rent" variant="light" arrow>
                Homes to rent
              </CtaLink>
              <CtaLink href={ROUTES.SHORTLET_MARKETPLACE} variant="outline-light">
                Short stays
              </CtaLink>
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
