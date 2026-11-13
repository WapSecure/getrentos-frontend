import type { SgIcon } from '@sureground/icons';
import { cn } from '@sureground/shared';

interface IconTileProps {
  icon: SgIcon;
  size?: 'sm' | 'md';
  className?: string;
}

/** A small blue-tinted square holding one icon; decorative, so hidden from screen readers. */
export const IconTile = ({ icon: Icon, size = 'md', className }: IconTileProps) => (
  <span
    aria-hidden="true"
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/15',
      size === 'md' ? 'h-11 w-11' : 'h-9 w-9',
      className
    )}
  >
    <Icon className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} />
  </span>
);
