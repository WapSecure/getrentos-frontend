'use client';

import type { LucideIcon } from 'lucide-react';

interface AuthMethodTab<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

interface AuthMethodTabsProps<T extends string> {
  label: string;
  value: T;
  tabs: AuthMethodTab<T>[];
  onChange: (value: T) => void;
}

export function AuthMethodTabs<T extends string>({
  label,
  value,
  tabs,
  onChange,
}: AuthMethodTabsProps<T>) {
  return (
    <div
      aria-label={label}
      className="grid grid-cols-3 gap-1 rounded-2xl border border-border/70 bg-secondary/70 p-1.5"
      role="tablist"
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
              selected
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border/60'
                : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
