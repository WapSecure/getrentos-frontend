'use client';

import * as RadixPopover from '@radix-ui/react-popover';
import { cn } from '@getrentos/shared';

/**
 * A panel anchored to a trigger (notification lists, quick filters): it closes
 * on Escape and on a click outside, moves focus in when it opens and back to
 * the trigger when it closes. For a list of actions, use DropdownMenu instead.
 */
export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverClose = RadixPopover.Close;

export const PopoverContent = ({
  className,
  sideOffset = 8,
  align = 'end',
  collisionPadding = 16,
  ...props
}: RadixPopover.PopoverContentProps) => (
  <RadixPopover.Portal>
    <RadixPopover.Content
      sideOffset={sideOffset}
      align={align}
      collisionPadding={collisionPadding}
      className={cn(
        'z-[70] w-[min(22rem,calc(100vw-2rem))] max-h-[min(32rem,var(--radix-popover-content-available-height))] overflow-y-auto rounded-2xl border border-border bg-card shadow-[0_16px_40px_rgba(0,0,0,0.16)] focus:outline-none',
        className
      )}
      {...props}
    />
  </RadixPopover.Portal>
);
