import { Banknote, Layers, Lock, Sparkles } from 'lucide-react';
import { MarketingCard, SectionHeading } from './primitives';

/**
 * Replaces a strip of made-up platform metrics (users, properties, volume). These
 * are facts about how the product works, so they stay true without a data feed.
 * When real usage numbers exist, this is the place to show them.
 */
const reasons = [
  {
    icon: Layers,
    title: 'One workspace',
    description:
      'Renters, landlords, owners, buyers, realtors and agents share one verification, escrow and dispute system.',
  },
  {
    icon: Banknote,
    title: 'Naira first',
    description:
      'Rent is quoted by the year or the month, the way you actually pay it, and settled through Paystack.',
  },
  {
    icon: Lock,
    title: 'Escrow on the money that matters',
    description: 'Rent and sale payments are held until the agreed conditions are met.',
  },
  {
    icon: Sparkles,
    title: 'Free to start',
    description:
      'Every role has a free plan. Pro adds tools for portfolios and teams when you outgrow it.',
  },
];

export const WhyGetRentos = () => (
  <section className="bg-gray-50 px-4 py-20 dark:bg-background">
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        badge="WHY GETRENTOS"
        title="Built for how property works here"
        description="A platform designed around the way renting, buying and managing property actually happens."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map((reason) => (
          <MarketingCard key={reason.title} className="p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <reason.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{reason.title}</h3>
            <p className="text-sm text-muted-foreground">{reason.description}</p>
          </MarketingCard>
        ))}
      </div>
    </div>
  </section>
);
