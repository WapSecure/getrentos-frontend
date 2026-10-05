import type { ElementType, ReactNode } from 'react';

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
    <header className="mb-7 rounded-2xl border border-border bg-card px-5 py-6 shadow-sm sm:px-7 sm:py-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
            <span>{eyebrow}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </header>
  );
}
