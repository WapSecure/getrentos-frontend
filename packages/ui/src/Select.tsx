'use client';

import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@getrentos/shared';
import { controlShell, type ControlSize } from './controlStyles';
import { useFieldControl } from './fieldContext';

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
  /** Id for the trigger; inside a Field the field supplies it. */
  id?: string;
  invalid?: boolean;
  required?: boolean;
  /** Show a clear button once something is chosen; clearing calls onValueChange(''). */
  clearable?: boolean;
  /** Shown when a search matches nothing. */
  emptyText?: string;
  controlSize?: ControlSize;
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
  id,
  invalid,
  required,
  clearable = false,
  emptyText = 'No matching options',
  controlSize,
}: SelectProps) {
  const field = useFieldControl({ id, invalid, required });
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const valueId = `${baseId}-value`;
  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );
  const visibleLabel = selected
    ? (selected.searchText ??
      (typeof selected.label === 'string' ? selected.label : selected.value))
    : placeholder;
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
    if (nextOpen) {
      window.setTimeout(() => {
        if (searchable) searchRef.current?.focus();
        else
          focusOption(
            Math.max(
              0,
              visibleOptions.findIndex((o) => o.value === value)
            )
          );
      }, 0);
    }
  };

  const optionButtons = () =>
    Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') ?? []
    );
  const focusOption = (index: number) => {
    const buttons = optionButtons();
    if (buttons.length) buttons[(index + buttons.length) % buttons.length].focus();
  };
  // Arrow keys move through the options; Home/End jump; Up from the first returns to search.
  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = optionButtons();
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(current + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (current <= 0 && searchable) searchRef.current?.focus();
      else focusOption(current - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(buttons.length - 1);
    }
  };

  return (
    <RadixPopover.Root open={open} onOpenChange={handleOpenChange}>
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          id={field.id}
          // A combobox (not a plain button) so the required/invalid state the
          // Field passes down is valid ARIA. Inside a Field the visible label
          // names it; a bare Select is named by its ariaLabel, or failing that
          // by the value it shows (as it was when it was a plain button).
          role="combobox"
          aria-label={
            ariaLabel && !field.labelId ? `${visibleLabel} ${ariaLabel}` : undefined
          }
          aria-labelledby={field.labelId ?? (ariaLabel ? undefined : valueId)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          {...field.ariaProps}
          disabled={disabled}
          onKeyDown={(event) => {
            if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              event.preventDefault();
              handleOpenChange(true);
            }
          }}
          className={cn(
            'flex items-center justify-between gap-2 text-left',
            controlShell({ size: controlSize, invalid: field.invalid, disabled }),
            className
          )}
        >
          <span
            id={valueId}
            className={cn('min-w-0 truncate', !selected && 'text-muted-foreground')}
          >
            {selected?.label ?? placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {clearable && selected && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear selection"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onValueChange('');
                }}
                className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-150',
                open && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </span>
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          sideOffset={6}
          align="start"
          className="z-[70] min-w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-lg"
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
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    focusOption(0);
                  } else if (
                    event.key === 'Enter' &&
                    visibleOptions.length === 1 &&
                    !visibleOptions[0].disabled
                  ) {
                    event.preventDefault();
                    onValueChange(visibleOptions[0].value);
                    handleOpenChange(false);
                  }
                }}
                placeholder={searchPlaceholder}
                aria-label={`Search ${ariaLabel ?? 'options'}`}
                className="min-h-9 w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
          )}
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={field.labelId ? undefined : ariaLabel}
            aria-labelledby={field.labelId}
            onKeyDown={onListKeyDown}
            className="max-h-64 overflow-y-auto overscroll-contain"
          >
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
                  'relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-9 text-left text-sm text-foreground outline-none transition-colors hover:bg-secondary focus:bg-secondary disabled:pointer-events-none disabled:opacity-45',
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
                {emptyText}
              </p>
            )}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
