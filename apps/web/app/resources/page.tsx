import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { Container } from '@/components/marketing/Container';
import { availableGuides } from '@/components/resources/availableGuides';
import { LegalNote } from '@/components/resources/LegalNote';
import { Eyebrow } from '@/components/marketing/Eyebrow';

export const metadata: Metadata = {
  title: 'Guides: payments, checks and buying from abroad',
  description:
    'Plain-English guides to how Sureground Payment Protection works, what a property check covers and its limits, and buying property in Nigeria from abroad.',
  alternates: { canonical: '/resources' },
};

export default async function ResourcesPage() {
  const guides = await availableGuides();
  return (
    <>
      <Navigation />
      <main id="main" className="bg-background">
        <section aria-labelledby="page-title" className="pt-24 pb-12 md:pt-32 md:pb-16">
          <Container>
            <Eyebrow className="mb-5">Guides</Eyebrow>
            <h1
              id="page-title"
              className="max-w-[18ch] text-[2.5rem] leading-[1.04] font-light tracking-[-0.02em] text-balance sm:text-[3.25rem] lg:text-[4rem]"
            >
              Know what is checked, and what is not
            </h1>
            <p className="mt-6 max-w-[56ch] text-base leading-relaxed text-muted-foreground md:text-[1.0625rem]">
              Short guides to how Sureground handles your money and checks property, written to show
              the limits as clearly as the protections.
            </p>
          </Container>
        </section>

        <section aria-label="All guides" className="border-y border-border bg-card py-16 md:py-20">
          <Container>
            <ul className="border-t border-border">
              {guides.map((guide) => (
                <li key={guide.slug} className="border-b border-border">
                  <Link
                    href={`/resources/${guide.slug}`}
                    className="group grid gap-3 py-8 md:grid-cols-[12rem_minmax(0,1fr)_auto] md:items-baseline md:gap-10"
                  >
                    <span className="label-caps text-muted-foreground">{guide.eyebrow}</span>
                    <span>
                      <span className="font-display block text-[1.75rem] leading-tight font-normal text-foreground group-hover:underline group-hover:underline-offset-4">
                        {guide.title}
                      </span>
                      <span className="mt-2 block max-w-[64ch] leading-relaxed text-muted-foreground">
                        {guide.summary}
                      </span>
                    </span>
                    <span aria-hidden="true" className="hidden text-xl text-foreground md:block">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <LegalNote className="mt-8 max-w-[72ch] text-sm leading-relaxed text-muted-foreground" />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
