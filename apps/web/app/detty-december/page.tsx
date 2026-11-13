import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { LandingHero } from '@/components/marketing/LandingHero';
import { RuledList } from '@/components/marketing/RuledList';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { photos } from '@/components/marketing/photos';
import { ShortletMarketplaceBrowser } from '@/components/shortlet/ShortletMarketplaceBrowser';
import { SupportContact } from '@/components/shared/support/SupportContact';
import { ROUTES } from '@/lib/constants/auth';
import { SITE_OG_IMAGES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Detty December short stays across Nigeria',
  description:
    'Short stays for Detty December. You pay Sureground, not the host, and the host is paid no sooner than 24 hours after your check-in time. Report a problem within 24 hours of check-in and we can refund you.',
  alternates: { canonical: '/detty-december' },
  openGraph: {
    images: SITE_OG_IMAGES,
    title: 'Detty December short stays on Sureground',
    description:
      'Your payment is held until after check-in, the total is shown before you book, and problems reported within 24 hours of check-in are reviewed for a refund.',
    url: '/detty-december',
    type: 'website',
  },
};

function peakWeek() {
  const year = new Date().getUTCFullYear();
  return { checkIn: `${year}-12-20`, checkOut: `${year}-12-27` };
}

// Each statement mirrors a backend rule (payout hold, Guest Promise window, inspection badge, stay quote).
const PROMISES = [
  {
    title: 'Your money is held until after you arrive',
    body: 'You pay Sureground, not the host. The host can withdraw only from 24 hours after your check-in time (72 hours for a host who has not been paid before), and never while you have a problem open with us.',
  },
  {
    title: 'Not as described? Tell us within 24 hours',
    body: 'Report it within 24 hours of your check-in time. The host’s payment stays frozen while we look into it, and if we uphold your report we refund all or part of your stay.',
  },
  {
    title: 'Look for “Inspected”',
    body: 'The badge means a licensed agent, with a verified identity and no link to the host, inspected the place in the last 12 months, rated its rooms and rated none of them poor.',
  },
  {
    title: 'The total, not a teaser',
    body: 'Pick your dates and each stay shows what you will pay: the nights, any cleaning fee and any tax that applies.',
  },
];

export default function DettyDecemberPage() {
  const { checkIn, checkOut } = peakWeek();
  return (
    <>
      <Navigation />
      <main id="main" className="bg-background">
        <LandingHero
          eyebrow="Detty December · 20 Dec to 3 Jan"
          title="Detty December, sorted."
          lead="Flying home or hosting the whole family? Book a short stay where your payment is held until at least 24 hours after check-in, and see the total before you pay. Popular places go early, and some hosts set a minimum stay over the peak."
          photo={photos.livingRoomEvening}
          actions={
            <CtaLink href="#stays" arrow>
              Find a December stay
            </CtaLink>
          }
        />

        <section
          aria-labelledby="dd-promises"
          className="border-y border-border bg-card py-20 md:py-28"
        >
          <Container>
            <SectionIntro
              id="dd-promises"
              eyebrow="Booking with Sureground"
              title="What happens to your money"
              lead="Before a stay can be listed, we need approved proof that the host owns the property or manages it with the owner’s authority."
            />
            <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
              {PROMISES.map(({ title, body }) => (
                <li key={title} className="border-t border-foreground/80 pt-6">
                  <h3 className="font-display mb-3 text-[1.5rem] leading-tight font-normal">
                    {title}
                  </h3>
                  <p className="max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
            <RuledList
              className="mt-14 max-w-3xl text-[0.9375rem]"
              items={[
                'A refundable deposit, where a host asks for one, is held separately and is not part of the stay total.',
                'A problem noticed after the first 24 hours can still be raised as a dispute from your booking.',
              ]}
            />
            <SupportContact
              className="mt-10"
              lead="Questions before you book? Talk to a person:"
              context="Detty December booking question"
            />
          </Container>
        </section>

        <section id="stays" aria-labelledby="dd-stays" className="scroll-mt-24 pt-20 md:pt-28">
          <Container>
            <SectionIntro
              id="dd-stays"
              eyebrow="Stays"
              title="December stays"
              lead="Dates start on the peak week. Change them to see what is free and what each stay will cost."
              className="mb-0 md:mb-0"
            />
          </Container>
          <ShortletMarketplaceBrowser
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            hideHeader
          />
        </section>

        <ClosingBand
          title="Hosting this December?"
          lead="List your place as a short stay. You will need approved proof that you own it, or the owner’s authority to manage it."
          actions={
            <CtaLink href={ROUTES.SIGNUP} variant="light" arrow>
              Start hosting
            </CtaLink>
          }
        />
      </main>
      <Footer />
    </>
  );
}
