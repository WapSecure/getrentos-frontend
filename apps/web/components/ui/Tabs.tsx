'use client';

import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/cn';

export const Tabs = RadixTabs.Root;

export const TabsList = ({ className, ...props }: RadixTabs.TabsListProps) => (
  <RadixTabs.List
    className={cn('inline-flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto', className)}
    {...props}
  />
);

export const TabsTrigger = ({ className, ...props }: RadixTabs.TabsTriggerProps) => (
  <RadixTabs.Trigger
    className={cn(
      'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors outline-none',
      'text-muted-foreground hover:text-foreground',
      'data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
);

export const TabsContent = RadixTabs.Content;
