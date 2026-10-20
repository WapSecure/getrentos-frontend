'use client';

import type { HTMLAttributes } from 'react';
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

interface PopoverContentProps extends RadixPopover.PopoverContentProps {
  /**
   * `sections`: compose PopoverHeader, PopoverBody and PopoverFooter; only
   * the body scrolls, so a title and a "View all" link stay in view.
   */
  layout?: 'scroll' | 'sections';
}

export const PopoverContent = ({
  className,
  sideOffset = 8,
  align = 'end',
  collisionPadding = 16,
  layout = 'scroll',
  ...props
}: PopoverContentProps) => (
  <RadixPopover.Portal>
    <RadixPopover.Content
      sideOffset={sideOffset}
      align={align}
      collisionPadding={collisionPadding}
      className={cn(
        'z-[70] w-[min(22rem,calc(100vw-2rem))] max-h-[min(32rem,var(--radix-popover-content-available-height))] rounded-2xl border border-border bg-card shadow-[0_16px_40px_rgba(0,0,0,0.16)] focus:outline-none',
        layout === 'sections' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto',
        className
      )}
      {...props}
    />
  </RadixPopover.Portal>
);

export const PopoverHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3', className)}
    {...props}
  />
);

export const PopoverBody = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('min-h-0 flex-1 overflow-y-auto', className)} {...props} />
);

export const PopoverFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('shrink-0 border-t border-border px-4 py-2.5', className)} {...props} />
);
