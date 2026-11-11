import { LinkButton } from './primitives';
import { ArrowRight } from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';

interface CTAAction {
  label: string;
  href: string;
}

interface CTAProps {
  title?: string;
  description?: string;
  primaryAction?: CTAAction;
  secondaryAction?: CTAAction;
}

export const CTA = ({
  title = 'Ready to get started?',
  description = 'Create a free account and see how verified renting, buying and managing property works.',
  primaryAction = { label: 'Create your account', href: ROUTES.SIGNUP },
  secondaryAction = { label: 'Learn more', href: '#features' },
}: CTAProps) => (
  <section className="px-4 py-20">
    <div className="mx-auto max-w-5xl text-center">
      <div className="rounded-2xl border border-border bg-card p-10 shadow-sm md:p-16">
        <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground md:text-5xl">
          {title}
        </h2>
        <p className="mx-auto mb-9 mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          {description}
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <LinkButton href={primaryAction.href} size="lg" className="group">
            {primaryAction.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </LinkButton>
          <LinkButton href={secondaryAction.href} variant="secondary" size="lg">
            {secondaryAction.label}
          </LinkButton>
        </div>
      </div>
    </div>
  </section>
);
