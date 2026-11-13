import { cn, getInitials } from '@sureground/shared';

const SIZES = {
  xs: 'h-6 w-6 text-2xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
} as const;

const TONES = {
  primary: 'bg-primary/10 text-primary ring-primary/15',
  neutral: 'bg-secondary text-muted-foreground ring-border',
} as const;

export interface AvatarProps {
  /** The person's name; their initials are shown. */
  name: string;
  size?: keyof typeof SIZES;
  /** `neutral` for someone who is not the subject of the row, such as an assignee. */
  tone?: keyof typeof TONES;
  className?: string;
}

/** A person's initials on a soft round tile. Decorative: show the name beside it. */
export function Avatar({ name, size = 'sm', tone = 'primary', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-[0.01em] ring-1 ring-inset',
        SIZES[size],
        TONES[tone],
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}
