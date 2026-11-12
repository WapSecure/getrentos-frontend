import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight, type SgIcon } from '@sureground/icons';
import { cn } from '@sureground/shared';

export interface StatGroupItem {
  label: string;
  value: ReactNode;
  subtitle?: ReactNode;
  /** A change against an earlier period; `tone` says whether it is good news, not its direction. */
  trend?: { label: string; tone: 'positive' | 'negative' | 'neutral' };
  /** Makes the figure the way into its page. */
  href?: string;
  /** Draws attention to a figure that needs action (overdue rent), without colouring the value. */
  attention?: boolean;
  /** A small glyph beside the label, as on StatCard, so a row of figures scans at a glance. */
  icon?: SgIcon;
  /** Block content under the figure, such as an indicative amount in another currency. */
  supplement?: ReactNode;
}

interface StatGroupProps {
  /** Shown above the figures; also names the group for screen readers. */
  title: string;
  items: StatGroupItem[];
  /** Content under the figures, such as a SegmentedBar. */
  footer?: ReactNode;
  action?: ReactNode;
  className?: string;
}

// Written out in full: Tailwind only generates classes it finds as literals.
const COLUMNS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-3 lg:grid-cols-5',
  6: 'sm:grid-cols-3 lg:grid-cols-6',
};

function Figure({ item }: { item: StatGroupItem }) {
  const Icon = item.icon;
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {item.attention && (
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
          )}
          {item.label}
          {item.href && (
            <ChevronRight
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
            />
          )}
        </p>
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-2 text-[1.625rem] font-semibold leading-tight tracking-[-0.02em] text-foreground tabular-nums">
        {item.value}
      </p>
      {(item.trend || item.subtitle) && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
          {item.trend && (
            <span
              className={cn(
                'font-medium tabular-nums',
                item.trend.tone === 'positive' && 'text-success',
                item.trend.tone === 'negative' && 'text-destructive',
                item.trend.tone === 'neutral' && 'text-foreground/75'
              )}
            >
              {item.trend.label}
            </span>
          )}
          {item.subtitle && <span>{item.subtitle}</span>}
        </p>
      )}
      {item.supplement && <div className="mt-1.5">{item.supplement}</div>}
    </>
  );
  const cell = 'block min-w-0 px-5 py-4';
  return item.href ? (
    <Link
      href={item.href}
      className={cn(
        cell,
        'group transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={cell}>{body}</div>
  );
}

/** Related figures in one panel, divided by hairlines, instead of a box per number. */
export function StatGroup({ title, items, footer, action, className }: StatGroupProps) {
  return (
    <section
      aria-label={title}
      className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-xs', className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
        {action}
      </div>
      {/* A 1px gap over the border colour draws the dividers, so they stay right as figures wrap. */}
      <div
        className={cn(
          'grid grid-cols-1 gap-px bg-border [&>*]:bg-card',
          COLUMNS[Math.min(items.length, 6)]
        )}
      >
        {items.map((item) => (
          <Figure key={item.label} item={item} />
        ))}
      </div>
      {footer && <div className="border-t border-border px-5 py-4">{footer}</div>}
    </section>
  );
}
