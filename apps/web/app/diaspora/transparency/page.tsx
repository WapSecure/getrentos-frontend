import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { TransparencyCentre } from '@/components/diaspora/public/TransparencyCentre';
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';
import { diasporaInvestEnabled } from '@/lib/diasporaAvailability';

export const metadata: Metadata = {
  title: 'Diaspora Invest transparency centre',
  description:
    'How Sureground Diaspora Invest works: Sureground’s role, who else is responsible, fees, what a check covers, your money, refunds, complaints, privacy, conflicts of interest and what is not yet decided.',
  alternates: { canonical: DIASPORA_ROUTES.TRANSPARENCY },
  openGraph: {
    title: 'Sureground Diaspora Invest: transparency centre',
    description: 'Who is responsible for what, what you pay and how refunds and complaints work.',
    url: DIASPORA_ROUTES.TRANSPARENCY,
    type: 'website',
  },
};

export default async function DiasporaTransparencyPage() {
  if (!(await diasporaInvestEnabled())) notFound();
  return (
    <>
      <Navigation />
      <main id="main" className="bg-background">
        <TransparencyCentre />
      </main>
      <Footer />
    </>
  );
}
