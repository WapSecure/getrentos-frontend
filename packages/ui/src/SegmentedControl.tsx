'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@sureground/shared';

export interface Segment<T extends string> {
  value: T;
  /** Still required for icon-only segments: it is read out. */
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  count?: number;
  countTone?: 'neutral' | 'warning';
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  segments: readonly Segment<T>[];
  'aria-label': string;
  iconOnly?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

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
      className={cn('inline-flex items-center gap-0.5 rounded-md bg-secondary p-1', className)}
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
              'inline-flex items-center justify-center gap-1.5 rounded-sm font-medium transition-[background-color,color,box-shadow] duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
              size === 'sm' ? 'min-h-8 px-2.5 text-xs' : 'min-h-9 px-3 text-sm',
              iconOnly && (size === 'sm' ? 'w-8 px-0' : 'w-9 px-0'),
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
                    : 'bg-foreground/[0.06] text-foreground/75'
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
