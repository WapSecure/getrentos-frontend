'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminSearchService, type AdminSearchType } from '@/services/adminSearchService';

const RECENT_KEY = 'getrentos-admin-recent-searches';
const typeLabel = (type: string) =>
  type.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export function AdminRecordSearch({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [type, setType] = useState<AdminSearchType | 'all'>('all');
  const instanceId = useId().replace(/:/g, '');
  const resultsId = `admin-record-search-results-${instanceId}`;
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      setRecent(JSON.parse(window.sessionStorage.getItem(RECENT_KEY) ?? '[]') as string[]);
    } catch {
      setRecent([]);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, []);
  const search = useQuery({
    queryKey: ['admin', 'global-search', debounced, type],
    queryFn: () => unwrap(adminSearchService.search(debounced, type === 'all' ? undefined : type)),
    enabled: focused && debounced.length >= 2,
    staleTime: 20_000,
  });
  const results = search.data?.results ?? [];
  const remember = (term: string) => {
    const next = [term, ...recent.filter((item) => item !== term)].slice(0, 5);
    setRecent(next);
    window.sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };
  const choose = () => {
    remember(query.trim());
    setFocused(false);
    setQuery('');
  };
  const open = focused && (query.length > 0 || recent.length > 0);
  return (
    <div ref={root} className={`relative w-full ${compact ? '' : 'max-w-md'}`}>
      <Input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onFocus={() => setFocused(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setFocused(false);
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, results.length - 1));
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          }
          if (event.key === 'Enter' && results[active]) {
            event.preventDefault();
            document.getElementById(`${resultsId}-${active}`)?.click();
          }
        }}
        placeholder="Search people, payments, bookings…"
        aria-label="Search backoffice records"
        aria-expanded={open}
        aria-controls={resultsId}
        aria-activedescendant={results[active] ? `${resultsId}-${active}` : undefined}
        leadingIcon={<Search className="h-4 w-4" aria-hidden="true" />}
      />
      {open && (
        <div
          id={resultsId}
          role="listbox"
          aria-label="Record search results"
          className="absolute left-0 right-0 z-[70] mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          {query.trim().length >= 2 && search.data && (
            <div
              className="flex gap-1 overflow-x-auto border-b border-border p-2"
              role="group"
              aria-label="Filter search by record type"
            >
              {(['all', ...search.data.availableTypes] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={type === item}
                  onClick={() => {
                    setType(item);
                    setActive(0);
                  }}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${type === item ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/70'}`}
                >
                  {item === 'all' ? 'All' : typeLabel(item)}
                </button>
              ))}
            </div>
          )}
          {query.trim().length < 2 ? (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Recent searches</p>
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary focus:bg-secondary"
                  onClick={() => setQuery(term)}
                >
                  {term}
                </button>
              ))}
              <p className="px-2 py-2 text-xs text-muted-foreground">
                Type at least two characters to search records.
              </p>
            </div>
          ) : search.isPending ? (
            <p className="p-4 text-sm text-muted-foreground" role="status">
              Searching records…
            </p>
          ) : search.isError ? (
            <div className="p-4 text-sm text-destructive" role="alert">
              Search is unavailable.{' '}
              <button type="button" className="underline" onClick={() => void search.refetch()}>
                Retry
              </button>
            </div>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground" role="status">
              No matching records you can access.
            </p>
          ) : (
            results.map((result, index) => (
              <Link
                key={`${result.type}-${result.id}`}
                id={`${resultsId}-${index}`}
                role="option"
                aria-selected={active === index}
                href={result.href}
                onMouseEnter={() => setActive(index)}
                onClick={choose}
                className={`block rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${active === index ? 'bg-secondary' : 'hover:bg-secondary'}`}
              >
                <span className="block text-xs font-medium text-primary">
                  {typeLabel(result.type)}
                </span>
                <span className="block font-medium text-foreground">{result.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {result.subtitle}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
