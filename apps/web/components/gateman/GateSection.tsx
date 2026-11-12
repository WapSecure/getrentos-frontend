import type { ReactNode } from 'react';
import { cn } from '@sureground/shared';

interface GateSectionProps {
  /** Used for the heading id, so the section is named by its title. */
  id: string;
  title: string;
  /** One plain line under the title saying what the list holds. */
  description?: ReactNode;
  /** Shows a count pill next to the title; omit while loading. */
  count?: number;
  /** Read out instead of the bare number, e.g. "3 inside". */
  countLabel?: string;
  /** Sits on the right of the header, e.g. a secondary action. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** The gate console's card section: header with title, count and a one-line explanation, then content. */
export const GateSection = ({
  id,
  title,
  description,
  count,
  countLabel,
  action,
  children,
  className,
}: GateSectionProps) => (
  <section
    aria-labelledby={`${id}-title`}
    className={cn('overflow-hidden rounded-2xl border border-border bg-card shadow-sm', className)}
  >
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 id={`${id}-title`} className="text-base font-semibold text-foreground">
            {title}
          </h2>
          {count !== undefined && (
            <span
              className={cn(
                'inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                count > 0 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
              )}
              aria-label={countLabel ?? String(count)}
            >
              {count}
            </span>
          )}
        </div>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
    {children}
  </section>
);

type Tone = 'neutral' | 'success' | 'warning' | 'danger';

const chipTone: Record<Tone, string> = {
  neutral: 'bg-secondary text-muted-foreground',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-destructive-subtle text-destructive',
};

/** The round leading icon on a gate list row, tinted by the row's state. */
export const GateRowIcon = ({
  tone = 'neutral',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) => (
  <span
    aria-hidden="true"
    className={cn(
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full [&>svg]:h-[1.125rem] [&>svg]:w-[1.125rem]',
      chipTone[tone]
    )}
  >
    {children}
  </span>
);

const edgeTone: Record<Tone, string> = {
  neutral: '',
  success: 'before:bg-success',
  warning: 'before:bg-warning',
  danger: 'before:bg-destructive',
};

/** A thin tinted bar on a row's left edge, for states that need the guard's attention. */
export const gateRowEdge = (tone: Tone) =>
  tone === 'neutral'
    ? ''
    : cn(
        'relative before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-r-full',
        edgeTone[tone]
      );
