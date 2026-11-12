'use client';

import { useId, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search } from '@sureground/icons';
import { Button } from '@sureground/ui/Button';
import { Input } from '@sureground/ui/Input';
import { SegmentedControl, type Segment } from '@sureground/ui/SegmentedControl';
import { cn } from '@sureground/shared';
import { useLandAvailability } from '@/hooks/useLandAvailability';
import { matchAreas, type Area } from './areas';
import { searchHref, type SearchKind } from './searchRoutes';

const KINDS: Segment<SearchKind>[] = [
  { value: 'buy', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
  { value: 'stays', label: 'Short stays' },
  { value: 'land', label: 'Land' },
];

export function HeroSearch({ className }: { className?: string }) {
  const router = useRouter();
  const land = useLandAvailability();
  const kinds = land.marketplace ? KINDS : KINDS.filter((k) => k.value !== 'land');
  const [kind, setKind] = useState<SearchKind>('rent');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const inputId = useId();
  const suggestions = useMemo(() => matchAreas(query), [query]);
  const showList = open && suggestions.length > 0;

  const go = (value: string) => {
    setOpen(false);
    router.push(searchHref(kind, value));
  };

  const choose = (area: Area) => {
    setQuery(area.name);
    go(area.name);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    go(query);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (event.key === 'Enter' && showList && active >= 0) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <form
      role="search"
      aria-label="Search property"
      onSubmit={onSubmit}
      className={cn('border border-border bg-card p-4 shadow-lg sm:p-6', className)}
    >
      <SegmentedControl
        aria-label="What are you looking for?"
        value={kind}
        onValueChange={setKind}
        segments={kinds}
        className="mb-4 w-full sm:w-auto [&>button]:flex-1 [&>button]:px-2 [&>button]:whitespace-nowrap sm:[&>button]:flex-none sm:[&>button]:px-4"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative min-w-0 flex-1">
          <label htmlFor={inputId} className="label-caps mb-2 block text-muted-foreground">
            Location
          </label>
          <Input
            id={inputId}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Area, estate or street"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            leadingIcon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            className="h-12"
          />
          {showList ? (
            <ul
              id={listId}
              role="listbox"
              aria-label="Suggested areas"
              className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto border border-border bg-card py-1 shadow-lg"
            >
              {suggestions.map((area, index) => (
                <li
                  key={`${area.name}-${area.city}`}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(area)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-sm',
                    index === active ? 'bg-secondary' : 'hover:bg-secondary/70'
                  )}
                >
                  <span className="font-medium">{area.name}</span>
                  <span className="label-caps text-muted-foreground">{area.city}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Button
          type="submit"
          size="lg"
          icon={<Search className="h-4 w-4" aria-hidden="true" />}
          iconPosition="right"
          className="h-12 px-8 text-[0.6875rem] tracking-[0.22em] uppercase"
        >
          Search
        </Button>
      </div>
    </form>
  );
}
