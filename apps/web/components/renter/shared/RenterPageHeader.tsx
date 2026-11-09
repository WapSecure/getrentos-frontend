import type { ElementType, ReactNode } from 'react';
import { PageHeader } from '@sureground/ui';

interface RenterPageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  icon?: ElementType;
  actions?: ReactNode;
  children?: ReactNode;
}

export function RenterPageHeader({
  eyebrow = 'Renter workspace',
  title,
  description,
  icon: Icon,
  actions,
  children,
}: RenterPageHeaderProps) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title={
        Icon ? (
          <span className="flex items-center gap-3">
            <Icon className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden="true" />
            {title}
          </span>
        ) : (
          title
        )
      }
      description={description}
      actions={actions}
      meta={children}
    />
  );
}
