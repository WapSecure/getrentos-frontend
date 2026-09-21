import {
  UserPlus,
  ShieldCheck,
  LayoutDashboard,
  ShoppingCart,
  FileSignature,
  Coins,
  CheckCircle,
  Star,
} from 'lucide-react';
import { MarketingCard, SectionHeading } from './primitives';

const steps = [
  {
    number: '01',
    title: 'Onboarding',
    icon: UserPlus,
    description: 'Sign up with email, phone, or OAuth.',
  },
  {
    number: '02',
    title: 'Verification',
    icon: ShieldCheck,
    description: 'Identity and property documentation checks.',
  },
  {
    number: '03',
    title: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Personalized workspace for your role.',
  },
  {
    number: '04',
    title: 'Actions',
    icon: ShoppingCart,
    description: 'List, search, apply, or make offers.',
  },
  {
    number: '05',
    title: 'Transaction',
    icon: FileSignature,
    description: 'Digital signing of agreements.',
  },
  {
    number: '06',
    title: 'Escrow',
    icon: Coins,
    description: 'Funds held securely until conditions met.',
  },
  {
    number: '07',
    title: 'Completion',
    icon: CheckCircle,
    description: 'Move-in or ownership transfer.',
  },
  { number: '08', title: 'Review', icon: Star, description: 'Rate and build your reputation.' },
];

export const HowItWorks = () => (
  // The id the navbar and footer link to (#how-it-works). It used to be "flow",
  // so those links never went anywhere.
  <section id="how-it-works" className="relative overflow-hidden px-4 py-20">
    <div className="relative z-10 mx-auto max-w-7xl">
      <SectionHeading
        badge="END-TO-END FLOW"
        title="From search to signature, one continuous loop."
        description="Every transaction passes through eight stages — trust built at every handoff."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <MarketingCard key={step.number} className="p-6">
            <div className="mb-3 text-4xl font-bold text-gray-200 dark:text-white/10">
              {step.number}
            </div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10">
              <step.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
          </MarketingCard>
        ))}
      </div>
    </div>
  </section>
);
