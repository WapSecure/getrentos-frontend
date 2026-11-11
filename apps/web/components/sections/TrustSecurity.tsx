import Link from 'next/link';
import { Shield, Lock, CreditCard, FileCheck, Eye, Users } from '@sureground/icons';
import { MarketingCard, MarketingIconTile, SectionHeading } from './primitives';

// No grade or licence claims ("bank-grade", "regulated", "AI-powered", "24/7"): they can't be shown.
const trustFeatures = [
  {
    icon: Shield,
    title: 'Identity verification',
    description:
      'Identity is checked before high-stakes actions such as listing, paying or signing.',
  },
  {
    icon: Lock,
    title: 'Payment Protection',
    description:
      'Rent is released to the landlord on schedule; a sale deposit only once the buyer confirms receipt. Disputes keep money held.',
  },
  {
    icon: CreditCard,
    title: 'Payments through Paystack',
    description:
      'Card and bank payments are processed by Paystack, so payment details never sit with landlords.',
  },
  {
    icon: FileCheck,
    title: 'Reviewed documents',
    description:
      'Ownership and title documents are reviewed by our team before a property is verified.',
  },
  {
    icon: Eye,
    title: 'Fraud review',
    description:
      'Fraud reports and alerts are reviewed by our team, and sensitive actions leave an audit trail.',
  },
  {
    icon: Users,
    title: 'You choose what to share',
    description:
      'Tenancy history and credit checks are shared only when you agree, and you can take them back.',
  },
];

export const TrustSecurity = () => (
  <section className="px-4 py-20">
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        badge="TRUST & SECURITY"
        title="How we protect your money and data"
        description="What the platform does to keep transactions and personal information safe."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trustFeatures.map((feature) => (
          <MarketingCard key={feature.title} className="p-6 text-center">
            <MarketingIconTile icon={feature.icon} size="lg" className="mx-auto mb-4" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </MarketingCard>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Read how we handle your data in our{' '}
        <Link href="/privacy" className="font-medium text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  </section>
);
