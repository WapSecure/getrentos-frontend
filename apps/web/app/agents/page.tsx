import type { Metadata } from 'next';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { FaqList, type Faq } from '@/components/marketing/FaqList';
import { FeatureRow } from '@/components/marketing/FeatureRow';
import { LandingHero } from '@/components/marketing/LandingHero';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { photos } from '@/components/marketing/photos';
import { ROUTES } from '@/lib/constants/auth';
import { SITE_OG_IMAGES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'For Realtors and Agencies',
  description:
    'Run your property business on Sureground: listings and your own public page, leads, viewings and offers, commission payouts, and agency tools for teams.',
  alternates: { canonical: '/agents' },
  openGraph: {
    images: SITE_OG_IMAGES,
    title: 'Sureground for realtors and agencies',
    description: 'Listings, leads, offers and commissions in one workspace.',
    url: '/agents',
    type: 'website',
  },
};

const TOOLS = [
  {
    title: 'Listings and a public page',
    body: 'Publish listings for owners who give you access, and share your own Sureground page with every listing on it.',
  },
  {
    title: 'Leads, viewings and offers',
    body: 'Enquiries arrive as leads. Book viewings, pass offers to owners and keep every conversation in one thread.',
  },
  {
    title: 'Commissions and payouts',
    body: 'Track what you are owed on each deal and get paid out to your verified bank account.',
  },
  {
    title: 'A profile buyers can check',
    body: 'Verify your identity and licence once. Your standing shows on your profile and listings.',
  },
];

const FAQ: Faq[] = [
  {
    q: 'Can I list a property I don’t own?',
    a: 'Yes, when the owner gives you access from their account. They can see what you do and remove access at any time.',
  },
  {
    q: 'Do agencies get team tools?',
    a: 'Yes. An agency can add realtors and field agents, assign owners and properties, and pay each agent their share of a commission.',
  },
  {
    q: 'What do I need to verify?',
    a: 'Your identity, and your professional licence if you have one. Some actions, such as receiving payouts, unlock only once these checks pass.',
  },
];

export default function AgentsPage() {
  return (
    <>
      <Navigation />
      <main id="main" className="bg-background">
        <LandingHero
          eyebrow="For realtors and agencies"
          title="Run your property business from one workspace"
          lead="List and market properties, follow up leads and viewings, pass offers to owners and get your commission paid out, with a profile buyers can check."
          photo={photos.houseDarkFacade}
          actions={
            <>
              <CtaLink href={ROUTES.SIGNUP} arrow>
                Create a realtor account
              </CtaLink>
              <CtaLink href={ROUTES.PRICING} variant="outline">
                See pricing
              </CtaLink>
            </>
          }
        />

        <section
          aria-labelledby="agent-tools"
          className="border-y border-border bg-card py-20 md:py-28"
        >
          <Container>
            <SectionIntro
              id="agent-tools"
              eyebrow="What you get"
              title="Everything a deal needs, in order"
            />
            <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
              {TOOLS.map((tool) => (
                <li key={tool.title} className="border-t border-border pt-6">
                  <h3 className="font-display mb-3 text-[1.5rem] font-normal">{tool.title}</h3>
                  <p className="max-w-[52ch] leading-relaxed text-muted-foreground">{tool.body}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section aria-label="Agencies" className="py-20 md:py-28">
          <Container>
            <FeatureRow
              eyebrow="Agencies"
              title="Run a team without losing track"
              photo={photos.lagosApartments}
            >
              <p>
                Bring your realtors and field agents into one agency workspace. Assign owners and
                properties, see each person’s pipeline and pay their commission share.
              </p>
            </FeatureRow>
          </Container>
        </section>

        <FaqList items={FAQ} name="agents-faq" title="Questions from realtors" />

        <ClosingBand
          title="Bring your listings and clients to Sureground"
          actions={
            <CtaLink href={ROUTES.SIGNUP} variant="light" arrow>
              Create a realtor account
            </CtaLink>
          }
        />
      </main>
      <Footer />
    </>
  );
}
