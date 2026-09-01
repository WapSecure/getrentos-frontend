import type { Metadata } from 'next';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { FeaturedProperty } from '@/components/sections/FeaturedProperty';
import { Features } from '@/components/sections/Features';
import { Roles } from '@/components/sections/Roles';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { Stats } from '@/components/sections/Stats';
import { Testimonials } from '@/components/sections/Testimonials';
import { TrustSecurity } from '@/components/sections/TrustSecurity';
import { Resources } from '@/components/sections/Resources';
import { CTA } from '@/components/sections/CTA';
import { DownloadApp } from '@/components/sections/DownloadApp';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Trust-Driven Property Operating System',
  description:
    'One workspace for renters, landlords, owners, buyers, realtors and agents. Verified identities, verified properties, escrow-secured payments — from first search to final signature.',
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE_NAME} — Rent, buy, and manage property with trust`,
    description:
      'Rent shortlets, buy land, and manage property on a platform built on verified identities and escrow-secured payments.',
    url: SITE_URL,
    type: 'website',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  description:
    'Trust-driven property operating system for renters, landlords, owners, buyers, realtors and agents.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@getrentos.com',
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
    target: `${SITE_URL}/shortlets?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function Home() {
  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <main className="min-h-screen bg-white dark:bg-background transition-colors duration-300">
        <Navigation />
        <Hero />
        <Stats />
        <FeaturedProperty />
        <Features />
        <Roles />
        <HowItWorks />
        <Testimonials />
        <TrustSecurity />
        <Resources />
        <CTA />
        <DownloadApp />
        <Footer />
      </main>
    </>
  );
}
