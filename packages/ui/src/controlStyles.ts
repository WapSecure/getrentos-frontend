import { cn } from '@sureground/shared';

export type ControlSize = 'sm' | 'md';

const SIZE: Record<ControlSize, string> = {
  sm: 'min-h-9 px-3 text-sm sm:min-h-8',
  md: 'min-h-11 px-3.5 text-sm sm:min-h-10',
};

// Written out in full: Tailwind only generates classes it finds as literals.
const STATE = {
  wraps: {
    normal:
      'border-border hover:border-foreground/20 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12',
    invalid:
      'border-destructive/70 focus-within:border-destructive focus-within:ring-4 focus-within:ring-destructive/15',
  },
  self: {
    normal:
      'border-border hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/12',
    invalid:
      'border-destructive/70 focus-visible:border-destructive focus-visible:ring-4 focus-visible:ring-destructive/15',
  },
} as const;

export function controlShell(opts: {
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  wraps?: boolean;
  className?: string;
}) {
  const states = STATE[opts.wraps ? 'wraps' : 'self'];
  return cn(
    'w-full rounded-md border bg-card text-foreground outline-none transition-[border-color,background-color,box-shadow] duration-150',
    SIZE[opts.size ?? 'md'],
    opts.invalid ? states.invalid : states.normal,
    opts.readOnly && 'bg-secondary/40',
    opts.disabled && 'cursor-not-allowed bg-secondary/60 opacity-60 hover:border-border',
    opts.className
  );
}

export const innerInputClass =
  'min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground focus:shadow-none disabled:cursor-not-allowed';
