import Link from 'next/link';
import { Shield, Lock, CreditCard, FileCheck, Eye, Users } from 'lucide-react';
import { MarketingCard, SectionHeading } from './primitives';

/**
 * Each item here is something the platform does today. Claims of a grade or a
 * licence ("bank-grade", "regulated", "AI-powered", "24/7") are left out on
 * purpose: they can't be shown, and a trust product can't afford to overstate.
 */
const trustFeatures = [
  {
    icon: Shield,
    title: 'Identity Verification',
    description:
      'Identity is checked before high-stakes actions such as listing, paying or signing.',
  },
  {
    icon: Lock,
    title: 'Escrow Protection',
    description: 'Payments are held in escrow until the agreed conditions are met.',
  },
  {
    icon: CreditCard,
    title: 'Payments Through Paystack',
    description:
      'Card and bank payments are processed by Paystack, so payment details never sit with landlords.',
  },
  {
    icon: FileCheck,
    title: 'Reviewed Documents',
    description:
      'Ownership and title documents are reviewed by our team before a property is verified.',
  },
  {
    icon: Eye,
    title: 'Fraud Review',
    description:
      'Fraud reports and alerts are reviewed by our team, and sensitive actions leave an audit trail.',
  },
  {
    icon: Users,
    title: 'You Choose What to Share',
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
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
