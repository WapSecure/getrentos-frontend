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
        'z-50 w-64 rounded-lg border border-border bg-card shadow-lg focus:outline-none',
        className
      )}
      {...props}
    />
  </RadixDropdown.Portal>
);

export const DropdownMenuItem = ({ className, ...props }: RadixDropdown.DropdownMenuItemProps) => (
  <RadixDropdown.Item
    className={cn(
      'flex items-center gap-3 px-4 py-2 text-sm text-foreground cursor-pointer outline-none transition-colors',
      'hover:bg-secondary focus:bg-secondary data-disabled:opacity-50 data-disabled:cursor-not-allowed',
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
