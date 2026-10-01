import type { Metadata } from 'next';
import { ClipboardCheck, Lock, ReceiptText, ShieldCheck } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { ShortletMarketplaceBrowser } from '@/components/shortlet/ShortletMarketplaceBrowser';
import { SupportContact } from '@/components/shared/support/SupportContact';

export const metadata: Metadata = {
  title: 'Detty December stays in Lagos, Abuja & beyond',
  description:
    'Verified short stays for Detty December. GetRentos holds your payment until you arrive, shows the all-in price up front, and refunds you if the place is not as described.',
  alternates: { canonical: '/detty-december' },
  openGraph: {
    title: 'Detty December stays: booked safely on GetRentos',
    description:
      'Verified hosts, all-in prices, and your money held until you arrive. Book your December stay before the rush.',
    url: '/detty-december',
    type: 'website',
  },
};

/** The first peak week of this year's season, so the page opens on real December totals. */
function peakWeek() {
  const year = new Date().getUTCFullYear();
  return { checkIn: `${year}-12-20`, checkOut: `${year}-12-27` };
}

const PROMISES = [
  {
    icon: Lock,
    title: 'Your money is held until you arrive',
    body: 'You pay GetRentos, not the host. The host is only paid after you check in.',
  },
  {
    icon: ShieldCheck,
    title: 'Not as described? You get it back',
    body: 'Tell us within 24 hours of check-in. We hold the host’s payment while we check, and refund you if we uphold it.',
  },
  {
    icon: ClipboardCheck,
    title: 'Look for “Inspected”',
    body: 'A licensed agent has been inside those stays in the last year and rated every room.',
  },
  {
    icon: ReceiptText,
    title: 'The total, not a teaser',
    body: 'Pick your dates and every stay shows what you’ll actually pay: nights, cleaning and VAT.',
  },
];

export default function DettyDecemberPage() {
  const { checkIn, checkOut } = peakWeek();
  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <span className="inline-flex items-center rounded-full border border-amber-300/60 bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            Dec 20 – Jan 3
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-0.02em] text-foreground sm:text-5xl">
            Detty December, sorted. Book a stay you can trust.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Flying home or hosting the whole family? Book a verified short stay where your money is
            held until you walk in, and the price you see is the price you pay. Popular places go
            early, and many hosts ask for a minimum stay over the peak.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-4">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-2 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <SupportContact
            className="mt-6"
            lead="Questions before you book? Talk to a person:"
            context="Detty December booking question"
          />
        </div>
      </section>
      <ShortletMarketplaceBrowser initialCheckIn={checkIn} initialCheckOut={checkOut} hideHeader />
      <Footer />
    </main>
  );
}
