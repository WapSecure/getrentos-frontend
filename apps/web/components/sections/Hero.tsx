import { ArrowRight, Shield, Lock, FileCheck, Eye, Sparkles } from 'lucide-react';
import { LinkButton } from './primitives';
import { ROUTES } from '@/lib/constants/auth';

/**
 * Only things the platform actually does. Each chip stays at "what happens", not
 * a grade or a licence ("bank-grade", "regulated") that nobody has awarded us.
 */
const trustItems = [
  { icon: Shield, text: 'IDENTITY VERIFICATION' },
  { icon: Lock, text: 'ESCROW-PROTECTED PAYMENTS' },
  { icon: FileCheck, text: 'PROPERTY DOCUMENT REVIEW' },
  { icon: Eye, text: 'FRAUD REPORTING & REVIEW' },
];

/**
 * Fixed positions, so the server and the browser draw the very same hero. (They
 * used to be random and generated after load, which is what made the whole hero
 * jump when the page hydrated.)
 */
const particles = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 8.3 + 4) % 96}%`,
  top: `${20 + ((i * 37) % 65)}%`,
  duration: 5 + (i % 5),
  delay: (i * 0.7) % 5,
}));

export const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Soft radial halos for an airy, premium glow. */}
      <div className="absolute inset-0 bg-[radial-gradient(85%_60%_at_50%_-10%,rgba(0,113,227,0.14),transparent_62%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(45%_38%_at_85%_25%,rgba(0,113,227,0.09),transparent_62%)]" />
      <div className="absolute bottom-0 left-1/2 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      {/* Faint dot grid for subtle texture. */}
      <div className="hero-dots absolute inset-0 opacity-40" />
    </div>

    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((particle, i) => (
        <span
          key={i}
          className="hero-particle absolute h-1 w-1 rounded-full bg-primary/30 opacity-0"
          style={
            {
              left: particle.left,
              top: particle.top,
              '--hero-duration': `${particle.duration}s`,
              '--hero-delay': `${particle.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent/80 px-4 py-1.5 shadow-sm backdrop-blur">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
          Trust-driven platform
        </span>
      </div>

      <h1 className="mb-6 text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-6xl lg:text-7xl">
        The trust-driven
        <span className="block bg-linear-to-r from-[#0071e3] via-[#0a84ff] to-[#5aa2ff] bg-clip-text text-transparent">
          property operating system.
        </span>
      </h1>
      <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
        One workspace for renters, landlords, owners, buyers, realtors and agents. Verified
        identities, verified properties, escrow-secured payments — from first search to final
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

      <ul className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2.5 border-t border-border/70 pt-8">
        {trustItems.map((item) => (
          <li
            key={item.text}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur"
          >
            <item.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {item.text}
          </li>
        ))}
      </ul>
    </div>

    <div className="absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
      <div className="hero-scroll-cue flex h-10 w-6 justify-center rounded-full border-2 border-gray-400 dark:border-gray-500">
        <div className="mt-2 h-2 w-1 rounded-full bg-gray-400 dark:bg-gray-500" />
      </div>
    </div>
  </section>
);
