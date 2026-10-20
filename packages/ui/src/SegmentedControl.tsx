'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@getrentos/shared';

export interface Segment<T extends string> {
  value: T;
  /** Visible text. For icon-only segments pass `icon` and still give a label: it is read out. */
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** A number after the label ("Periods 3"); hidden when undefined. */
  count?: number;
  /** `warning` marks a count that needs attention (unconfigured, overdue). */
  countTone?: 'neutral' | 'warning';
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  segments: readonly Segment<T>[];
  /** Names the group for screen readers, e.g. "View". */
  'aria-label': string;
  /** Hide the text and show only icons (the label is still read out). */
  iconOnly?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A small set of mutually exclusive views or modes: grid/list, month/week/day.
 * Arrow keys move between segments; Tab enters and leaves the group as one stop.
 * For switching page sections with their own content, use Tabs instead.
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  segments,
  'aria-label': ariaLabel,
  iconOnly = false,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (!delta) return;
    event.preventDefault();
    for (let step = 1; step <= segments.length; step++) {
      const next = (index + delta * step + segments.length) % segments.length;
      if (!segments[next].disabled) {
        refs.current[next]?.focus();
        onValueChange(segments[next].value);
        return;
      }
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-border bg-secondary/60 p-0.5',
        className
      )}
    >
      {segments.map((segment, index) => {
        const active = segment.value === value;
        return (
          <button
            key={segment.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={iconOnly ? segment.label : undefined}
            title={iconOnly ? segment.label : undefined}
            disabled={segment.disabled}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(segment.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-[background-color,color,box-shadow] duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              iconOnly && (size === 'sm' ? 'w-7 px-0' : 'w-8 px-0'),
              active
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {segment.icon && (
              <span aria-hidden="true" className="inline-flex [&_svg]:h-4 [&_svg]:w-4">
                {segment.icon}
              </span>
            )}
            {!iconOnly && segment.label}
            {segment.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  segment.countTone === 'warning'
                    ? 'bg-warning-subtle text-warning'
                    : 'bg-foreground/[0.06] text-muted-foreground'
                )}
              >
                {segment.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
