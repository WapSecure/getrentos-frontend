import type { ReactNode } from 'react';
import { cn } from '@sureground/shared';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  /** Where this page sits; the last item is the page itself. */
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  meta,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('page-header', className)}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 1 ? (
          <Breadcrumbs items={breadcrumbs} className="mb-3" />
        ) : null}
        {eyebrow ? (
          <p className="mb-2 text-sm font-medium text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
        {meta ? <div className="mt-3 text-sm text-muted-foreground">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
