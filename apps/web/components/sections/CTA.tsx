import { LinkButton } from './primitives';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';

export const CTA = () => (
  <section className="px-4 py-20">
    <div className="mx-auto max-w-5xl text-center">
      <div className="rounded-2xl border border-border bg-card p-10 shadow-sm md:p-16">
        <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground md:text-5xl">
          Ready to get started?
        </h2>
        <p className="mx-auto mb-9 mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          Create a free account and see how verified renting, buying and managing property works.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <LinkButton href={ROUTES.SIGNUP} size="lg" className="group">
            Create your account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </LinkButton>
          <LinkButton href="#features" variant="secondary" size="lg">
            Learn more
          </LinkButton>
        </div>
      </div>
    </div>
  </section>
);
