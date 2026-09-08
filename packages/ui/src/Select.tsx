'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@getrentos/shared';

export interface SelectOption {
  value: string;
  label: ReactNode;
  /** Searchable text for rich/non-string labels. Falls back to the label or value. */
  searchText?: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  disabled,
  ariaLabel,
  className,
  searchable = true,
  searchPlaceholder = 'Search options…',
}: SelectProps) {
  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => {
      const text =
        option.searchText ?? (typeof option.label === 'string' ? option.label : option.value);
      return text.toLocaleLowerCase().includes(normalizedQuery);
    });
  }, [options, query]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery('');
    if (nextOpen && searchable) window.setTimeout(() => searchRef.current?.focus(), 0);
  };

  return (
    <RadixPopover.Root open={open} onOpenChange={handleOpenChange}>
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 text-left text-sm text-foreground outline-none transition-[border-color,background-color,box-shadow] duration-150',
            'hover:border-foreground/20',
            'focus:border-primary focus:ring-4 focus:ring-primary/12 data-[placeholder]:text-muted-foreground disabled:cursor-not-allowed disabled:bg-secondary/60 disabled:opacity-60 disabled:hover:border-border',
            className
          )}
        >
          <span className={selected ? undefined : 'text-muted-foreground'}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          sideOffset={6}
          align="start"
          className="z-[70] min-w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]"
        >
          {searchable && (
            <div className="relative mb-1 border-b border-border p-1 pb-2">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-[calc(50%+2px)] text-muted-foreground"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={`Search ${ariaLabel ?? 'options'}`}
                className="min-h-9 w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
          )}
          <div role="listbox" aria-label={ariaLabel} className="max-h-64 overflow-y-auto">
            {visibleOptions.map((option) => (
              <button
                key={option.value}
                disabled={option.disabled}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onValueChange(option.value);
                  handleOpenChange(false);
                }}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-9 text-left text-sm text-foreground outline-none transition-colors hover:bg-secondary focus:bg-secondary disabled:pointer-events-none disabled:opacity-45',
                  option.value === value && 'font-medium'
                )}
              >
                {option.label}
                {option.value === value && (
                  <span className="absolute right-3 inline-flex items-center text-primary">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            ))}
            {visibleOptions.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground" role="status">
                No matching options
              </p>
            )}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
