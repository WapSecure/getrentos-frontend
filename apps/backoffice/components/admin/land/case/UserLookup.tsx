'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, UserRound, X } from 'lucide-react';
import { Button, Input, Skeleton } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import type { PlatformUser } from '@/types/admin';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PickedUser {
  id: string;
  name: string;
  email?: string;
}

interface UserLookupProps {
  value: PickedUser | null;
  onChange: (user: PickedUser | null) => void;
  /** Only offer platform staff (the API maps every staff role to `admin`). */
  staffOnly?: boolean;
  /** `users.view`: without it, only a pasted user id can be used. */
  canSearch: boolean;
  placeholder?: string;
  ariaLabel: string;
}

/**
 * Finds a user by name or email through the admin users search, or accepts a
 * pasted user id. The API still decides whether the person may be used.
 */
export const UserLookup = ({
  value,
  onChange,
  staffOnly = false,
  canSearch,
  placeholder,
  ariaLabel,
}: UserLookupProps) => {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [term]);

  const isId = UUID_PATTERN.test(debounced);
  const search = useQuery({
    queryKey: ['admin', 'land', 'user-lookup', debounced],
    queryFn: () => unwrap(adminService.listUsers({ search: debounced, pageSize: 8 })),
    enabled: canSearch && debounced.length >= 2 && !isId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
  const results = (search.data?.items ?? []).filter(
    (user: PlatformUser) => !staffOnly || user.roles.includes('admin')
  );

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium text-foreground">{value.name}</span>
          {value.email && <span className="truncate text-muted-foreground">{value.email}</span>}
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onChange(null)}
          icon={<X className="h-3.5 w-3.5" />}
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={
          placeholder ?? (canSearch ? 'Search by name or email, or paste a user id' : 'User id')
        }
        leadingIcon={<Search className="h-4 w-4" />}
        aria-label={ariaLabel}
      />
      {isId && (
        <Button
          variant="outline"
          size="xs"
          onClick={() => onChange({ id: debounced, name: `User ${debounced.slice(0, 8)}…` })}
        >
          Use this user id
        </Button>
      )}
      {canSearch && debounced.length >= 2 && !isId && (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
          {search.isLoading ? (
            <div role="status" aria-label="Searching" className="space-y-2 px-3 py-2.5">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ) : search.isError && !search.data ? (
            <p className="px-3 py-2 text-xs text-destructive">
              {search.error instanceof Error ? search.error.message : 'Search failed.'}
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No {staffOnly ? 'staff ' : ''}users match “{debounced}”.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-secondary/60"
                    onClick={() => {
                      onChange({ id: user.id, name: user.fullName, email: user.email });
                      setTerm('');
                    }}
                  >
                    <span className="font-medium text-foreground">{user.fullName}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
