import type { Metadata } from 'next';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { ClosingBand } from '@/components/marketing/ClosingBand';
import { Container } from '@/components/marketing/Container';
import { CtaLink } from '@/components/marketing/CtaLink';
import { LandingHero } from '@/components/marketing/LandingHero';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { photos } from '@/components/marketing/photos';
import { SUPPORT } from '@/lib/support';
import { ROUTES } from '@/lib/constants/auth';

export const metadata: Metadata = {
  title: 'About Sureground',
  description:
    'Sureground is a Lagos-based property platform for renting, buying, selling and managing property in Nigeria, built around verification and protected payments.',
  alternates: { canonical: '/about' },
};

const PRINCIPLES = [
  {
    title: 'Check before you commit',
    body: 'Identity, ownership and documents are checked before the moments that matter: listing, paying and signing.',
  },
  {
    title: 'Money moves on evidence',
    body: 'Payments go through Sureground Payment Protection and are released on schedule or once the payer confirms.',
  },
  {
    title: 'Say only what we can show',
    body: 'We don’t promise returns, rankings or outcomes. Every verified mark points to a check that actually happened.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main id="main" className="bg-background">
        <LandingHero
          eyebrow="About Sureground"
          title="Property in Nigeria, checked before you commit"
          lead="Sureground brings renting, buying, selling, short stays and property management into one place, with the checks and payment protection that property deals in Nigeria too often lack."
          photo={photos.lagosResidential}
        />

        <section
          aria-labelledby="about-principles"
          className="border-y border-border bg-card py-20 md:py-28"
        >
          <Container>
            <SectionIntro
              id="about-principles"
              eyebrow="How we work"
              title="Three rules we build by"
            />
            <ul className="grid gap-x-10 gap-y-12 md:grid-cols-3">
              {PRINCIPLES.map((item) => (
                <li key={item.title} className="border-t border-border pt-6">
                  <h3 className="font-display mb-3 text-[1.5rem] font-normal">{item.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section aria-labelledby="about-contact" className="py-20 md:py-28">
          <Container className="grid gap-10 md:grid-cols-2 md:gap-16">
            <SectionIntro
              id="about-contact"
              eyebrow="Contact"
              title="Talk to us"
              layout="stacked"
              className="mb-0"
            />
            <dl className="grid gap-6 border-t border-border pt-6 text-[0.9375rem]">
              <div>
                <dt className="label-caps mb-1 text-muted-foreground">Email</dt>
                <dd>
                  <a href={`mailto:${SUPPORT.email}`} className="underline underline-offset-4">
                    {SUPPORT.email}
                  </a>
                </dd>
              </div>
              {SUPPORT.phone ? (
                <div>
                  <dt className="label-caps mb-1 text-muted-foreground">Phone</dt>
                  <dd>{SUPPORT.phone}</dd>
                </div>
              ) : null}
              <div>
                <dt className="label-caps mb-1 text-muted-foreground">Office</dt>
                <dd>Lagos, Nigeria</dd>
              </div>
            </dl>
          </Container>
        </section>

        <ClosingBand
          title="Start with a search"
          actions={
            <>
              <CtaLink href="/rent" variant="light" arrow>
                Homes to rent
              </CtaLink>
              <CtaLink href={ROUTES.SIGNUP} variant="outline-light">
                Create an account
              </CtaLink>
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
