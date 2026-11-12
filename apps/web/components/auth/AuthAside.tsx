import { FileCheck, Lock, Shield, Users } from '@sureground/icons';
import { Logo } from '@/components/ui/Logo';

// Only what the platform demonstrably does: no "bank-grade", biometric, forgery-detection,
// round-the-clock or "every user is verified" claims (see the landing-page honesty rules).
const FACTS = [
  {
    icon: Shield,
    title: 'Identity checks',
    body: 'Identity is checked before high-stakes actions such as listing, paying or signing.',
  },
  {
    icon: Lock,
    title: 'Payment Protection',
    body: 'Rent is released to the landlord on schedule; a sale deposit only once the buyer confirms.',
  },
  {
    icon: FileCheck,
    title: 'Reviewed documents',
    body: 'Ownership and title documents are reviewed by our team before a property is marked verified.',
  },
  {
    icon: Users,
    title: 'One account, every role',
    body: 'Rent, buy, list and manage property from a single sign-in.',
  },
];

const COPY = {
  signin: {
    eyebrow: 'Welcome back',
    title: 'Pick up where you left off',
    lead: 'Your viewings, offers, payments and messages are where you left them.',
  },
  signup: {
    eyebrow: 'Create an account',
    title: 'Property you can check before you commit',
    lead: 'One free account to search, book viewings, make offers and pay through Sureground Payment Protection.',
  },
  reset: {
    eyebrow: 'Account recovery',
    title: 'Get back into your account',
    lead: 'We will send a reset link to the email address on your account.',
  },
} as const;

/** The left panel shared by sign-in, sign-up and password reset. Server-rendered, no motion. */
export const AuthAside = ({ variant }: { variant: keyof typeof COPY }) => {
  const copy = COPY[variant];
  return (
    <aside className="relative hidden border-r border-border bg-card lg:flex lg:w-1/2">
      <div className="flex w-full flex-col justify-between p-12 xl:p-16">
        <Logo size="sm" />
        <div className="max-w-xl py-12">
          <p className="label-caps mb-5 text-muted-foreground">{copy.eyebrow}</p>
          <h2 className="font-display text-[2.75rem] leading-[1.05] font-light tracking-[-0.015em] text-balance xl:text-[3.25rem]">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
            {copy.lead}
          </p>
          <ul className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {FACTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="border-t border-border pt-5">
                <Icon className="mb-4 h-5 w-5 text-foreground" aria-hidden="true" />
                <h3 className="font-display mb-1.5 text-xl font-normal">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="label-caps text-muted-foreground">Lagos, Nigeria</p>
      </div>
    </aside>
  );
};
