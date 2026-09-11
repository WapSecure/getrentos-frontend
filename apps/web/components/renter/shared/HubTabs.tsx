'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ElementType } from 'react';

export interface HubTab {
  id: string;
  label: string;
  icon: ElementType;
}

/**
 * Reads the active tab from `?tab=` and returns a setter that writes it back
 * (dropping the param entirely for the default tab, so the canonical URL
 * stays clean). Shared by the renter hub pages that merged several former
 * sidebar entries into one tabbed destination.
 */
export function useHubTab(defaultTab: string, validTabs: readonly string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const param = searchParams.get('tab');
  const activeTab = param && validTabs.includes(param) ? param : defaultTab;

  const setTab = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === defaultTab) params.delete('tab');
      else params.set('tab', id);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, defaultTab]
  );

  return [activeTab, setTab] as const;
}

interface HubTabsProps {
  tabs: HubTab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function HubTabs({ tabs, activeTab, onChange, className }: HubTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Section tabs"
      className={`mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border/70 bg-secondary/60 p-1 ${className ?? ''}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
