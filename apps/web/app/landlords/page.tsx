import type { Metadata } from 'next';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { JsonLd } from '@/components/seo/JsonLd';
import { ArrowLink } from '@/components/marketing/ArrowLink';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { FaqList } from '@/components/marketing/FaqList';
import { FeatureRow } from '@/components/marketing/FeatureRow';
import { LandingHero } from '@/components/marketing/LandingHero';
import { RuledList } from '@/components/marketing/RuledList';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { StepList } from '@/components/marketing/StepList';
import { photos } from '@/components/marketing/photos';
import { faqJsonLd, type PlainFaq } from '@/lib/faqJsonLd';
import { ROUTES } from '@/lib/constants/auth';
import { SITE_OG_IMAGES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'For Landlords: Let Your Property in Nigeria',
  description:
    'List a unit, screen applicants, sign leases online and collect rent through Sureground Payment Protection, with repairs and deposits in one place.',
  alternates: { canonical: '/landlords' },
  openGraph: {
    images: SITE_OG_IMAGES,
    title: 'Sureground for landlords',
    description: 'Listings, applications, leases, rent and maintenance in one workspace.',
    url: '/landlords',
    type: 'website',
  },
};

const STEPS = [
  {
    title: 'Verify and list',
    body: 'Verify your identity, upload an ownership document for the property, then publish a vacant unit with its rent and fees.',
  },
  {
    title: 'Review applications',
    body: 'Each applicant arrives with a screening report. Ask for more information, approve or reject from the same screen.',
  },
  {
    title: 'Sign the lease',
    body: 'Approving an application drafts the lease. Send it, the tenant signs online and you countersign.',
  },
  {
    title: 'Collect rent',
    body: 'Start a rent schedule and Sureground raises each invoice before it falls due, until the lease ends.',
  },
];

const SCREENING = [
  'Whether the rent looks affordable against the income the applicant declared.',
  'Earlier tenancies on Sureground: signed leases, on-time payments and ratings from earlier landlords.',
  'Whether their identity, email and phone number are verified, and their trust score.',
  'References and next of kin, with a place to record what each reference told you.',
  'The documents the applicant chose to share with you.',
];

const AFTER_MOVE_IN = [
  'Tenants report maintenance issues from their account, with photos, and you follow each request to completion.',
  'Hold, deduct against and return security deposits, with a record of each step.',
  'Overdue rent is flagged automatically and listed oldest first.',
  'Send renewal offers and serve notices against the notice periods you record.',
  'Record inspections, which the tenant acknowledges from their account.',
];

const FAQ: PlainFaq[] = [
  {
    q: 'Do I have to verify before I list?',
    a: 'Yes. Your identity is checked before you can publish a listing, and each property needs an ownership document, such as a Certificate of Occupancy, Governor’s Consent or deed of assignment, reviewed by our team before it can be listed for rent.',
  },
  {
    q: 'When does the rent reach me?',
    a: 'Tenants pay rent to Sureground under Sureground Payment Protection. On a new lease, the first rent is released to you when the tenant confirms move-in. Later rent is released on the release date shown with each payment, and your payments page shows when each amount is paid out to you.',
  },
  {
    q: 'Can tenants pay part of the rent?',
    a: 'Yes. A part payment counts towards the charge, and your tenant’s payments page shows what is still owed.',
  },
  {
    q: 'Can a realtor manage the listing for me?',
    a: 'Yes. You can give a realtor access to market your property and take it back whenever you choose.',
  },
  {
    q: 'What does it cost?',
    a: 'See the Pricing page for current plans and fees. Vendor work orders, quotes and preventive maintenance are part of property management, which is on the Pro plan.',
  },
];

export default function LandlordsPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      <Navigation />
      <main id="main" className="bg-background">
        <LandingHero
          eyebrow="For landlords and property managers"
          title="Let your property to tenants you can check"
          lead="List a unit, review applicants with a screening report, sign the lease online and collect rent, with maintenance and deposits in the same place."
          photo={photos.lagosApartments}
          actions={
            <>
              <CtaLink href={ROUTES.SIGNUP} arrow>
                List a property to rent
              </CtaLink>
              <CtaLink href={ROUTES.PRICING} variant="outline">
                See pricing
              </CtaLink>
            </>
          }
        />

        <section
          aria-labelledby="landlord-steps"
          className="border-y border-border bg-card py-20 md:py-28"
        >
          <Container>
            <SectionIntro
              id="landlord-steps"
              eyebrow="How letting works"
              title="From a vacant unit to a signed lease"
              lead="Each step is recorded in your dashboard, so you and your tenant can see where things stand."
            />
            <StepList steps={STEPS} />
          </Container>
        </section>

        <section aria-label="Letting in detail" className="py-20 md:py-28">
          <Container className="flex flex-col gap-20 md:gap-28">
            <FeatureRow
              eyebrow="Applications"
              title="A screening report with every application"
              photo={photos.livingRoomEvening}
            >
              <p>Applicants verify their identity before they can apply. For each one you see:</p>
              <RuledList items={SCREENING} className="mt-5" />
            </FeatureRow>
            <FeatureRow
              eyebrow="Rent"
              title="Rent held until your tenant has the keys"
              photo={photos.houseWhiteCubic}
              reverse
            >
              <p>
                Tenants pay by card or bank transfer. Sureground holds the rent under Sureground
                Payment Protection: on a new lease, the first rent is released to you when the
                tenant confirms move-in, and later rent on the release date shown with each payment.
              </p>
              <p>
                Rent schedules can be monthly, quarterly or yearly, with any service charge or levy
                added to every invoice.
              </p>
            </FeatureRow>
            <FeatureRow
              eyebrow="After move-in"
              title="Maintenance, deposits and notices"
              photo={photos.diningKitchen}
              action={<ArrowLink href={ROUTES.HOME_MANAGEMENT}>Property management</ArrowLink>}
            >
              <RuledList items={AFTER_MOVE_IN} />
            </FeatureRow>
            <FeatureRow
              eyebrow="Realtors"
              title="Work with a realtor, on your terms"
              photo={photos.houseDarkFacade}
              reverse
              action={<ArrowLink href="/agents">For realtors and agencies</ArrowLink>}
            >
              <p>
                Give a realtor access to market your property and take it back whenever you choose.
              </p>
            </FeatureRow>
          </Container>
        </section>

        <FaqList items={FAQ} name="landlord-faq" title="Letting questions" />

        <ClosingBand
          title="Ready to list your first unit?"
          lead="Create a free account, verify your identity and add your property."
          actions={
            <>
              <CtaLink href={ROUTES.SIGNUP} variant="light" arrow>
                Get started
              </CtaLink>
              <CtaLink href="/sell" variant="outline-light">
                Selling instead?
              </CtaLink>
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
