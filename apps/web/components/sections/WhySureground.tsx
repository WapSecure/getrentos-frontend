import { Banknote, Layers, Lock, BadgeCheck } from '@sureground/icons';
import { MarketingCard, SectionHeading } from './primitives';

const reasons = [
  {
    icon: Layers,
    title: 'One workspace',
    description:
      'Renters, landlords, owners, buyers, realtors and agents share one verification, payment protection and dispute system.',
  },
  {
    icon: Banknote,
    title: 'Naira first',
    description:
      'Rent is quoted by the year or the month, the way you actually pay it, and settled through Paystack.',
  },
  {
    icon: Lock,
    title: 'Sureground holds the money',
    description:
      'Rent is released to the landlord on schedule. A sale deposit only reaches the seller once the buyer confirms receipt. A dispute keeps either one held.',
  },
  {
    icon: BadgeCheck,
    title: 'Free to start',
    description:
      'Every role has a free plan. Pro adds tools for portfolios and teams when you outgrow it.',
  },
];

export const WhySureground = () => (
  <section className="bg-muted/50 px-4 py-20 dark:bg-background">
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        badge="WHY SUREGROUND"
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
