import {
  Shield,
  Lock,
  FileCheck,
  Eye,
  Banknote,
  BarChart3,
  Users2,
  Smartphone,
} from 'lucide-react';
import { MarketingCard, SectionHeading } from './primitives';

// Each line says what the platform does, not a grade or a licence.
const features = [
  {
    icon: Shield,
    title: 'Identity Verification',
    description:
      'Identity is checked before high-stakes actions, so you know who you are dealing with.',
  },
  {
    icon: FileCheck,
    title: 'Property Verification',
    description: 'Ownership and title documents are reviewed before a property is marked verified.',
  },
  {
    icon: Lock,
    title: 'Escrow Protection',
    description: 'Payments are held in escrow until the agreed conditions are met.',
  },
  {
    icon: Eye,
    title: 'Fraud Review',
    description: 'Fraud reports and alerts are reviewed by our team.',
  },
  {
    icon: Banknote,
    title: 'Payouts to Your Bank',
    description: 'Earnings are paid to your bank account once conditions are met.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'See income, spending and how each property performs.',
  },
  {
    icon: Users2,
    title: 'Role-Based Access',
    description: 'Granular permissions for every user type.',
  },
  {
    icon: Smartphone,
    title: 'Works on Your Phone',
    description: 'Use it in your phone’s browser today, with a mobile app on the way.',
  },
];

export const Features = () => (
  <section id="features" className="relative overflow-hidden px-4 py-20">
    <div className="relative z-10 mx-auto max-w-7xl">
      <SectionHeading
        badge="PLATFORM FEATURES"
        title="Everything you need in one platform"
        description="Built on trust, powered by technology, designed for real estate professionals."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <MarketingCard key={feature.title} className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
          </MarketingCard>
        ))}
      </div>
    </div>
  </section>
);
