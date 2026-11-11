import { ArrowRight, Shield, Lock, FileCheck, Eye } from '@sureground/icons';
import { LinkButton, TrustStrip } from './primitives';
import { ROUTES } from '@/lib/constants/auth';

// No grade or licence claims ("bank-grade", "regulated") that nobody has awarded.
const trustItems = [
  { icon: Shield, text: 'IDENTITY VERIFICATION' },
  { icon: Lock, text: 'PROTECTED PAYMENTS' },
  { icon: FileCheck, text: 'PROPERTY DOCUMENT REVIEW' },
  { icon: Eye, text: 'FRAUD REPORTING & REVIEW' },
];

export const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent/80 px-4 py-1.5 shadow-sm backdrop-blur">
        <Shield className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
          Property services in one place
        </span>
      </div>

      <h1 className="mb-6 text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-6xl lg:text-7xl">
        Rent, buy and manage property
        <span className="block text-primary">with fewer surprises.</span>
      </h1>
      <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
        One workspace for renters, landlords, owners, buyers, realtors and agents. Verified
        identities, verified properties and protected payments, from first search to final
        signature.
      </p>
      <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <LinkButton href={ROUTES.SIGNUP} size="lg" className="group">
          Get early access
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </LinkButton>
        <LinkButton href="#features" variant="secondary" size="lg">
          Explore the platform
        </LinkButton>
      </div>

      <TrustStrip
        items={trustItems}
        className="mx-auto mt-4 max-w-3xl border-t border-border/70 pt-8"
      />
    </div>

    <div className="absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
      <div className="hero-scroll-cue flex h-10 w-6 justify-center rounded-full border-2 border-muted-foreground/60">
        <div className="mt-2 h-2 w-1 rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  </section>
);
