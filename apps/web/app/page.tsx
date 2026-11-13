import type { Metadata } from 'next';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { HomeHero } from '@/components/home/HomeHero';
import { LatestListings } from '@/components/home/LatestListings';
import { Journeys } from '@/components/home/Journeys';
import { AreaIndex } from '@/components/home/AreaIndex';
import { TrustFacts } from '@/components/home/TrustFacts';
import { DiasporaFeature } from '@/components/home/DiasporaFeature';
import { HomeFaq } from '@/components/home/HomeFaq';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { CtaLink } from '@/components/marketing/CtaLink';
import { JsonLd } from '@/components/seo/JsonLd';
import { ROUTES } from '@/lib/constants/auth';
import { diasporaInvestEnabled } from '@/lib/diasporaAvailability';
import { OPTIONAL_FETCH_TIMEOUT_MS } from '@/lib/publicFetch';
import { SITE_NAME, SITE_OG_IMAGES, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Homes to Rent and Buy, Short Stays and Land in Nigeria',
  description:
    'Search homes to rent or buy, short stays and land across Lagos, Abuja and beyond. See what has been checked on each listing, and pay through Sureground Payment Protection.',
  alternates: { canonical: '/' },
  openGraph: {
    images: SITE_OG_IMAGES,
    title: `${SITE_NAME}: property you can check before you commit`,
    description:
      'Homes to rent and buy, short stays and land across Nigeria. Verified listings are marked, and payments are protected.',
    url: SITE_URL,
    type: 'website',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  description: 'Property services for renters, landlords, owners, buyers, realtors and agents.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@getsureground.io',
    contactType: 'customer support',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/rent?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

// Its own async component, so the check runs alongside the listings fetch instead of before it.
async function DiasporaSection() {
  const on = await diasporaInvestEnabled({ timeoutMs: OPTIONAL_FETCH_TIMEOUT_MS });
  return on ? <DiasporaFeature /> : null;
}

export default function Home() {
  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <Navigation />
      <main id="main" className="bg-background">
        <HomeHero />
        <LatestListings />
        <Journeys />
        <AreaIndex />
        <TrustFacts />
        <DiasporaSection />
        <HomeFaq />
        <ClosingBand
          eyebrow="Free to join"
          title="List, rent or buy with fewer surprises"
          lead="Create a free account to book viewings, make offers and pay through Sureground Payment Protection."
          actions={
            <>
              <CtaLink href={ROUTES.SIGNUP} variant="light" arrow>
                Get started
              </CtaLink>
              <CtaLink href="/rent" variant="outline-light">
                Browse homes
              </CtaLink>
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
