'use client';

import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/cn';

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export const DropdownMenuContent = ({
  className,
  sideOffset = 8,
  align = 'end',
  ...props
}: RadixDropdown.DropdownMenuContentProps) => (
  <RadixDropdown.Portal>
    <RadixDropdown.Content
      sideOffset={sideOffset}
      align={align}
      className={cn(
        'z-[70] w-64 rounded-2xl border border-border bg-card p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.16)] focus:outline-none',
        className
      )}
      {...props}
    />
  </RadixDropdown.Portal>
);

export const DropdownMenuItem = ({ className, ...props }: RadixDropdown.DropdownMenuItemProps) => (
  <RadixDropdown.Item
    className={cn(
      'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors',
      'hover:bg-secondary focus:bg-secondary data-disabled:cursor-not-allowed data-disabled:opacity-50',
      className
    )}
    {...props}
  />
);

export const DropdownMenuLabel = ({
  className,
  ...props
}: RadixDropdown.DropdownMenuLabelProps) => (
  <RadixDropdown.Label className={cn('px-4 py-2', className)} {...props} />
);

export const DropdownMenuSeparator = ({
  className,
  ...props
}: RadixDropdown.DropdownMenuSeparatorProps) => (
  <RadixDropdown.Separator className={cn('h-px bg-border my-1', className)} {...props} />
);
