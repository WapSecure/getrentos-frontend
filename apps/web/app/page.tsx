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
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Homes to Rent and Buy, Short Stays and Land in Nigeria',
  description:
    'Search homes to rent or buy, short stays and land across Lagos, Abuja and beyond. Verified listings, identity checks and Sureground Payment Protection.',
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE_NAME}: property you can check before you commit`,
    description:
      'Homes to rent and buy, short stays and land across Nigeria, with verified listings and protected payments.',
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

export default async function Home() {
  const diaspora = await diasporaInvestEnabled();
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
        {diaspora ? <DiasporaFeature /> : null}
        <HomeFaq />
        <ClosingBand
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
