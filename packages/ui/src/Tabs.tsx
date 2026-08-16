'use client';

import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@getrentos/shared';

export const Tabs = RadixTabs.Root;

export const TabsList = ({ className, ...props }: RadixTabs.TabsListProps) => (
  <RadixTabs.List
    className={cn(
      'inline-flex w-fit gap-1 overflow-x-auto rounded-xl border border-border/70 bg-secondary/80 p-1',
      className
    )}
    {...props}
  />
);

export const TabsTrigger = ({ className, ...props }: RadixTabs.TabsTriggerProps) => (
  <RadixTabs.Trigger
    className={cn(
      'rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus:ring-4 focus:ring-primary/12',
      'text-muted-foreground hover:text-foreground',
      'data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
);

export const TabsContent = RadixTabs.Content;
