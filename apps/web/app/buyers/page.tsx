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
import { ListingStrip } from '@/components/marketing/ListingStrip';
import { RuledList } from '@/components/marketing/RuledList';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { StepList } from '@/components/marketing/StepList';
import { photos } from '@/components/marketing/photos';
import { faqJsonLd, type PlainFaq } from '@/lib/faqJsonLd';
import { landAvailability } from '@/lib/landAvailability';
import { LAND_PROTECTION, SALE_DEPOSIT_PROTECTION } from '@/lib/paymentCopy';
import { ROUTES } from '@/lib/constants/auth';
import { SITE_OG_IMAGES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'For Buyers: Buy a Home or Land in Nigeria',
  description:
    'Search homes and land for sale, see what has been checked and by whom, make offers and pay your deposit through Sureground Payment Protection.',
  alternates: { canonical: '/buyers' },
  openGraph: {
    images: SITE_OG_IMAGES,
    title: 'Sureground for buyers',
    description: 'Checked listings, offers in one thread and a protected deposit.',
    url: '/buyers',
    type: 'website',
  },
};

const HOME_STEPS = [
  {
    title: 'Search',
    body: 'Search homes for sale by area, price and type, or show verified listings only.',
  },
  {
    title: 'See it',
    body: 'Ask for a viewing, take a live video tour, or book an independent inspection.',
  },
  {
    title: 'Make an offer',
    body: 'Verify your identity, then make an offer and negotiate with the seller in one thread.',
  },
  {
    title: 'Pay a protected deposit',
    body: 'Pay the deposit to Sureground. It is released to the seller once the handover is done and you confirm.',
  },
];

const LAND_STEPS = [
  {
    title: 'Read the review',
    body: 'Each listing shows its level of review, what was checked, by whom and when, and what was not verified.',
  },
  {
    title: 'Inspect or tour',
    body: 'Book an independent inspection, or have the seller walk you round on a live video call.',
  },
  {
    title: 'Start the purchase',
    body: 'Confirm you have read what was not verified, and choose to pay in full or by instalments where a plan is offered.',
  },
  {
    title: 'Pay step by step',
    body: 'Each conveyance step’s share is paid to the seller only after you confirm that step was delivered.',
  },
];

const PROTECTION_DOES = [
  'Holds your money with our payment providers, Paystack and Monnify, instead of passing it straight to the seller.',
  'Releases a house or flat deposit when you confirm, and each land stage when it is evidenced.',
  'Keeps money held while a dispute is reviewed.',
  'Records every payment and release so you can see where your money is.',
];

const PROTECTION_DOES_NOT = [
  'It is not insurance and not a bank deposit.',
  'It does not guarantee title, value or that a purchase completes.',
  'For houses and flats only the deposit is protected; the balance is paid under your sale contract.',
];

const CHECK_LIMITS = [
  'A document upload never proves title. A check records what was reviewed on a date; it is not a guarantee of title, value or condition.',
  'Houses and flats do not yet have the independent legal review that land has. We recommend instructing your own lawyer for a home purchase.',
  'Checks go out of date. Look at the date on each one, and ask for a fresh check before you pay if it is old.',
];

const HOME_FAQ: PlainFaq[] = [
  {
    q: 'Who checks a home’s ownership?',
    a: 'The seller’s identity is checked and a Sureground reviewer must approve their ownership proof before the listing shows as verified. Houses and flats do not yet have an independent legal review, so we recommend you also instruct your own lawyer.',
  },
  {
    q: 'What happens to my deposit?',
    a: `${SALE_DEPOSIT_PROTECTION} If you raise a dispute, it stays held while it is resolved. If the sale does not go ahead, you are refunded under the sale terms.`,
  },
  {
    q: 'Does Sureground hold the full purchase price?',
    a: 'No. For a house or flat, Payment Protection covers the deposit only. The rest of the price is paid outside Sureground under your sale contract.',
  },
  {
    q: 'Can someone act for me if I cannot be there?',
    a: 'Yes. You can appoint people you trust in Nigeria to follow your purchases, attend visits and approve the release of a deposit with you.',
  },
];

const LAND_FAQ: PlainFaq = {
  q: 'Who checks the land?',
  a: 'Every land listing shows its level of review. A basic review means Sureground reviewed the ownership documents and the diligence checklist; registry-searched adds an official registry search on the title; independently reviewed adds checks by an independent professional, such as a surveyor or lawyer. Each check names who carried it out, what they were asked to check and when.',
};

export default async function BuyersPage() {
  const land = await landAvailability();
  // A failed call counts as open, matching the land pages themselves.
  const showLand = !land || land.marketplace;
  const faq = showLand ? [...HOME_FAQ, LAND_FAQ] : HOME_FAQ;

  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <Navigation />
      <main id="main" className="bg-background">
        <LandingHero
          eyebrow="For buyers"
          title="Buy property you have checked"
          lead={
            showLand
              ? 'Search homes and land for sale, see what has been checked and by whom, and pay through Sureground Payment Protection instead of straight to the seller.'
              : 'Search homes for sale, see what has been checked, and pay your deposit through Sureground Payment Protection instead of straight to the seller.'
          }
          photo={photos.housePoolTerrace}
          actions={
            <>
              <CtaLink href="/buy" arrow>
                See homes for sale
              </CtaLink>
              {showLand ? (
                <CtaLink href={ROUTES.LAND_MARKETPLACE} variant="outline">
                  Browse land
                </CtaLink>
              ) : (
                <CtaLink href={ROUTES.SIGNUP} variant="outline">
                  Create an account
                </CtaLink>
              )}
            </>
          }
        />

        <section
          aria-labelledby="buyer-home-steps"
          className="border-y border-border bg-card py-20 md:py-28"
        >
          <Container>
            <SectionIntro
              id="buyer-home-steps"
              eyebrow="Buying a home"
              title="From search to a protected deposit"
              lead="Viewings, offers and payments are recorded in your account, so you and the seller can see where things stand."
            />
            <StepList steps={HOME_STEPS} />
          </Container>
        </section>

        {showLand ? (
          <section aria-labelledby="buyer-land-steps" className="py-20 md:py-28">
            <Container>
              <SectionIntro
                id="buyer-land-steps"
                eyebrow="Buying land"
                title="Land, checked and paid for in stages"
                lead={LAND_PROTECTION}
                action={<ArrowLink href={ROUTES.LAND_MARKETPLACE}>Browse land</ArrowLink>}
              />
              <StepList steps={LAND_STEPS} />
            </Container>
          </section>
        ) : null}

        <section
          aria-label="Buying in detail"
          className={showLand ? 'border-y border-border bg-card py-20 md:py-28' : 'py-20 md:py-28'}
        >
          <Container className="flex flex-col gap-20 md:gap-28">
            <FeatureRow
              eyebrow="Sureground Payment Protection"
              title="What it does, and what it does not"
              photo={photos.villaWhitePool}
            >
              <RuledList items={PROTECTION_DOES} />
              <p className="label-caps pt-4 text-muted-foreground">It does not</p>
              <RuledList items={PROTECTION_DOES_NOT} />
            </FeatureRow>
            <FeatureRow
              eyebrow="Inspections and tours"
              title="See it without taking anyone’s word for it"
              photo={photos.houseDusk}
              reverse
            >
              <p>
                An accredited inspector visits a home or land you are considering and reports with
                geotagged, timestamped photos. Sureground checks each report before you see it.
              </p>
              <p>
                A live video tour lets you see a property without travelling, at a time shown in
                your own time zone. A tour is never a search, a survey or an inspection.
              </p>
            </FeatureRow>
            <FeatureRow
              eyebrow="The limits of a check"
              title="Know what a check does not prove"
              photo={photos.livingRoomEvening}
            >
              <RuledList items={CHECK_LIMITS} />
            </FeatureRow>
          </Container>
        </section>

        <ListingStrip
          market="sale"
          id="buyer-latest"
          title="Homes for sale now"
          href="/buy"
          cta="All homes for sale"
        />

        <FaqList items={faq} name="buyer-faq" title="Buying questions" />

        <ClosingBand
          title="Start with what has been checked"
          lead="Browse without an account. Create one and verify your identity when you are ready to make an offer."
          actions={
            <>
              <CtaLink href="/buy" variant="light" arrow>
                Homes for sale
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
