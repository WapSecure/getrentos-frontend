import Link from 'next/link';
import { CreditCard, Eye, FileCheck, Lock, Shield, Users } from '@sureground/icons';
import { Container } from '@/components/marketing/Container';
import { IconTile } from '@/components/marketing/IconTile';
import { SectionIntro } from '@/components/marketing/SectionIntro';

// Only what the platform demonstrably does: no grade, licence, "AI" or round-the-clock claims.
const FACTS = [
  {
    icon: Shield,
    title: 'Identity checks',
    body: 'Identity is checked before high-stakes actions such as listing, paying or signing.',
  },
  {
    icon: Lock,
    title: 'Payment Protection',
    body: 'Rent is released to the landlord on schedule; a sale deposit only once the buyer confirms. Disputes keep money held.',
  },
  {
    icon: FileCheck,
    title: 'Reviewed documents',
    body: 'Ownership and title documents are reviewed by our team before a property is marked verified.',
  },
  {
    icon: CreditCard,
    title: 'Payments through Paystack',
    body: 'Card and bank payments are processed by Paystack, so your payment details never sit with landlords.',
  },
  {
    icon: Eye,
    title: 'Fraud review',
    body: 'Fraud reports are reviewed by our team, and sensitive actions leave an audit trail.',
  },
  {
    icon: Users,
    title: 'You choose what to share',
    body: 'Tenancy history and credit checks are shared only when you agree, and you can withdraw consent.',
  },
];

export const TrustFacts = () => (
  <section aria-labelledby="trust-title" className="border-y border-border bg-card py-20 md:py-28">
    <Container>
      <SectionIntro
        id="trust-title"
        eyebrow="Trust and safety"
        title="What we check, and where your money goes"
        lead={
          <>
            The checks behind every verified mark and protected payment. Read how we handle your
            data in our{' '}
            <Link
              href="/privacy"
              className="text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              privacy policy
            </Link>
            .
          </>
        }
      />
      <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {FACTS.map(({ icon, title, body }) => (
          <li key={title} className="border-t border-border pt-6">
            <IconTile icon={icon} className="mb-5" />
            <h3 className="font-display mb-2 text-[1.375rem] font-normal">{title}</h3>
            <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);
