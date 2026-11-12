import { ClosingBand } from '@/components/marketing/ClosingBand';
import { CtaLink } from '@/components/marketing/CtaLink';
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
  secondaryAction = { label: 'Learn more', href: '/#how-it-works' },
}: CTAProps) => (
  <ClosingBand
    title={title}
    lead={description}
    actions={
      <>
        <CtaLink href={primaryAction.href} variant="light" arrow>
          {primaryAction.label}
        </CtaLink>
        <CtaLink href={secondaryAction.href} variant="outline-light">
          {secondaryAction.label}
        </CtaLink>
      </>
    }
  />
);
