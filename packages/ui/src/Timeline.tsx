import type { ReactNode } from 'react';
import { Check, Minus, X } from '@sureground/icons';
import { cn } from '@sureground/shared';
import { singleCurrent, type TimelineState } from './timelineStates';

// Presentational and hook-free, so it renders on the server. Nothing fades in: a list that
// only appears after JavaScript runs is invisible to a slow first paint and to reduced motion.

export type { TimelineState };

export interface TimelineItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Shown beside the title; pass a `<time>` when there is a machine-readable date. */
  date?: ReactNode;
  state: TimelineState;
  /** Replaces the default glyph inside the marker (a check, the step number, a dot). */
  icon?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}

interface TimelineProps {
  items: readonly TimelineItem[];
  /** `steps`: a process with an order and a current step. `feed`: things that happened. */
  variant?: 'steps' | 'feed';
  /** `horizontal` is the compact stepper for cards: markers and titles only. */
  orientation?: 'vertical' | 'horizontal';
  /** Heading level of each title; `p` when the list sits under a heading of its own. */
  titleAs?: 'p' | 'h3' | 'h4';
  /** Spoken after each title so state never rests on colour or shape alone. */
  stateLabels?: Partial<Record<TimelineState, string>>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

const STATE_LABEL: Record<TimelineState, string> = {
  done: 'Done',
  current: 'In progress',
  pending: 'Not started',
  blocked: 'Blocked',
  skipped: 'Skipped',
};

// Written out in full: Tailwind only generates classes it finds as literals.
const MARKER: Record<TimelineState, string> = {
  done: 'bg-primary text-primary-foreground',
  current: 'bg-primary/20 text-primary ring-2 ring-primary',
  pending: 'bg-secondary text-muted-foreground',
  blocked: 'bg-destructive-subtle text-destructive ring-1 ring-destructive/40',
  skipped: 'bg-secondary text-muted-foreground',
};

const FEED_MARKER = 'bg-secondary text-muted-foreground';

const TITLE_TONE: Record<TimelineState, string> = {
  done: 'text-foreground',
  current: 'text-foreground',
  pending: 'text-muted-foreground',
  blocked: 'text-foreground',
  skipped: 'text-muted-foreground',
};

function Glyph({
  item,
  index,
  variant,
  small,
}: {
  item: TimelineItem;
  index: number;
  variant: 'steps' | 'feed';
  small: boolean;
}) {
  if (item.icon) return <>{item.icon}</>;
  const size = small ? 'h-3 w-3' : 'h-3.5 w-3.5';
  if (item.state === 'done' && variant === 'steps') return <Check className={size} />;
  if (item.state === 'blocked') return <X className={size} />;
  if (item.state === 'skipped') return <Minus className={size} />;
  if (variant === 'feed') return <span className="h-2 w-2 rounded-full bg-current" />;
  return (
    <span className={cn('font-semibold tabular-nums', small ? 'text-2xs' : 'text-xs')}>
      {index + 1}
    </span>
  );
}

export function Timeline({
  items: passed,
  variant = 'steps',
  orientation = 'vertical',
  titleAs: Title = 'p',
  stateLabels,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  className,
}: TimelineProps) {
  // One step is current at a time; more than one is a caller bug, shown as pending.
  const items = singleCurrent(passed, (count) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `Timeline: ${count} items have state "current"; only the first is treated as current.`
      );
    }
  });
  const label = (state: TimelineState) => stateLabels?.[state] ?? STATE_LABEL[state];
  // A feed of things that happened says nothing extra for an ordinary past event.
  const spoken = (state: TimelineState) =>
    variant === 'feed' && state === 'done' ? '' : label(state);

  if (orientation === 'horizontal') {
    return (
      <ol
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        className={cn('flex items-start', className)}
      >
        {items.map((item, index) => {
          const reached = item.state === 'done' || item.state === 'current';
          return (
            <li
              key={item.id}
              aria-current={item.state === 'current' ? 'step' : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center text-center"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute right-1/2 top-2.5 h-0.5 w-full',
                    reached ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  'relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  MARKER[item.state]
                )}
              >
                <Glyph item={item} index={index} variant={variant} small />
              </span>
              <span
                className={cn(
                  'mt-1.5 text-xs leading-4',
                  reached ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {item.title}
                <span className="sr-only">, {label(item.state)}</span>
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  const feed = variant === 'feed';
  return (
    <ol aria-label={ariaLabel} aria-labelledby={labelledBy} className={className}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const said = spoken(item.state);
        return (
          <li
            key={item.id}
            aria-current={item.state === 'current' ? 'step' : undefined}
            className={cn('relative flex gap-3', !last && 'pb-5')}
          >
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute bottom-0 w-0.5 -translate-x-1/2 rounded-full',
                  feed ? 'left-4 top-9 bg-border' : 'left-3 top-7',
                  !feed && (item.state === 'done' ? 'bg-primary' : 'bg-border')
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'relative flex shrink-0 items-center justify-center rounded-full',
                feed ? 'h-8 w-8' : 'h-6 w-6',
                feed && item.state === 'done' ? FEED_MARKER : MARKER[item.state]
              )}
            >
              <Glyph item={item} index={index} variant={variant} small={false} />
            </span>
            <div className={cn('min-w-0 flex-1', feed ? 'pt-1.5' : 'pt-0.5')}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Title className={cn('text-sm font-medium', TITLE_TONE[item.state])}>
                  {item.title}
                  {said && <span className="sr-only">, {said}</span>}
                </Title>
                {item.badge}
                {item.date && (
                  <span className={cn('text-xs text-muted-foreground', feed && 'sm:ml-auto')}>
                    {item.date}
                  </span>
                )}
              </div>
              {item.description && (
                <div className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {item.description}
                </div>
              )}
              {item.actions && <div className="mt-2">{item.actions}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
