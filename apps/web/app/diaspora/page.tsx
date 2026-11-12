import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { DiasporaInvestLanding } from '@/components/diaspora/public/DiasporaInvestLanding';
import { diasporaInvestEnabled } from '@/lib/diasporaAvailability';

export const metadata: Metadata = {
  title: 'Diaspora Invest: Buy and Manage Property in Nigeria from Abroad',
  description:
    'Sureground Diaspora Invest: find, buy, own and manage property in Nigeria from abroad, with checks by named professionals, Sureground Payment Protection and one workspace for everything.',
  alternates: { canonical: '/diaspora' },
  openGraph: {
    title: 'Sureground Diaspora Invest',
    description: 'Invest back home, with evidence.',
    url: '/diaspora',
    type: 'website',
  },
};

export default async function DiasporaInvestPage() {
  if (!(await diasporaInvestEnabled())) notFound();
  return (
    <>
      <Navigation />
      <main id="main" className="bg-background">
        <DiasporaInvestLanding />
      </main>
      <Footer />
    </>
  );
}
