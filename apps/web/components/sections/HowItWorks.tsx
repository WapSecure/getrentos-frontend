import {
  UserPlus,
  ShieldCheck,
  LayoutDashboard,
  ShoppingCart,
  FileSignature,
  Coins,
  CheckCircle,
  Star,
} from '@sureground/icons';
import { MarketingCard, MarketingIconTile, SectionHeading } from './primitives';

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
    description: 'Personalised workspace for your role.',
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
    title: 'Protected payment',
    icon: Coins,
    description: 'Rent released on schedule; sale deposits once the buyer confirms receipt.',
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
  // The id the navbar and footer link to (#how-it-works).
  <section id="how-it-works" className="relative overflow-hidden px-4 py-20">
    <div className="relative z-10 mx-auto max-w-7xl">
      <SectionHeading
        badge="END-TO-END FLOW"
        title="From search to signature, one continuous loop."
        description="Every transaction passes through eight stages: trust built at every handoff."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <MarketingCard key={step.number} className="p-6">
            {/* Decorative, but still meets the 3:1 large-text contrast minimum in both themes. */}
            <div className="mb-3 text-4xl font-bold text-muted-foreground/75" aria-hidden="true">
              {step.number}
            </div>
            <MarketingIconTile icon={step.icon} className="mb-3" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </MarketingCard>
        ))}
      </div>
    </div>
  </section>
);
