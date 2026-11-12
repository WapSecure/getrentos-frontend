import type { ReactNode } from 'react';
import type { SgIcon } from '@sureground/icons';
import { ListSkeleton } from '@sureground/ui';
import { cn } from '@sureground/shared';

/**
 * The estate workspace list pattern (same as the gate console's Inside now panel): a card with a
 * title, a count and one line saying what is listed, then filters, rows and paging.
 */
interface EstateListSectionProps {
  /** Used for the heading id the section is labelled by. */
  id: string;
  title: string;
  /** Hidden while undefined, so a loading list never shows 0. */
  count?: number;
  /** Read out instead of the bare number, such as "12 passes". */
  countLabel?: string;
  description?: ReactNode;
  action?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function EstateListSection({
  id,
  title,
  count,
  countLabel,
  description,
  action,
  toolbar,
  footer,
  children,
  className,
}: EstateListSectionProps) {
  const titleId = `${id}-title`;
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card shadow-xs',
        className
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="text-base font-semibold text-foreground">
              {title}
            </h2>
            {count !== undefined && (
              <span
                className={cn(
                  'inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                  count > 0 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                )}
              >
                <span aria-hidden="true">{count}</span>
                <span className="sr-only">{countLabel ?? String(count)}</span>
              </span>
            )}
          </div>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </header>
      {toolbar && <div className="border-b border-border px-5 py-3">{toolbar}</div>}
      {children}
      {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
    </section>
  );
}

/** Filter chips: one scrolling line on a phone, wrapping from small screens up. */
export function EstateFilterChips({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-5 flex gap-2 overflow-x-auto px-5 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      {children}
    </div>
  );
}

export function EstateListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="p-5">
      <ListSkeleton rows={rows} />
    </div>
  );
}

export function EstateRowList({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-border">{children}</ul>;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

/** Leading mark for a row: a person's initials in a circle, or an icon in a rounded square. */
export function RowAvatar({
  name,
  icon: Icon,
  tone = 'neutral',
}: {
  name?: string;
  icon?: SgIcon;
  tone?: 'neutral' | 'primary' | 'warning' | 'danger' | 'success';
}) {
  const toneClass = {
    neutral: 'bg-secondary text-foreground',
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning-subtle text-warning',
    danger: 'bg-destructive-subtle text-destructive',
    success: 'bg-success-subtle text-success',
  }[tone];
  if (Icon) {
    return (
      <span
        aria-hidden="true"
        className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', toneClass)}
      >
        <Icon className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
        toneClass
      )}
    >
      {initials(name ?? '') || '?'}
    </span>
  );
}

/**
 * One row: leading mark, a title line (with any badges), meta lines, actions on the right. On a
 * phone the actions drop under the text, lined up with it.
 */
export function EstateRow({
  leading,
  title,
  meta,
  children,
  actions,
  align = 'center',
}: {
  leading: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  /** Block content under the meta lines, such as a message body. */
  children?: ReactNode;
  actions?: ReactNode;
  align?: 'center' | 'start';
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 px-5 py-4 sm:flex-row sm:justify-between sm:gap-4',
        align === 'center' ? 'sm:items-center' : 'sm:items-start'
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {leading}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">{title}</div>
          {meta && <div className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">{meta}</div>}
          {children}
        </div>
      </div>
      {actions && (
        <div className="ml-[3.25rem] flex shrink-0 flex-wrap items-center gap-2 sm:ml-0">
          {actions}
        </div>
      )}
    </div>
  );
}
