'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface DiscoverSearchBarProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
}

export const DiscoverSearchBar = ({ initialQuery = '', onSearch }: DiscoverSearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} role="search">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <LegacyInput
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search properties"
          placeholder="Search by area, property or landmark"
          className="w-full rounded-lg border border-border bg-card py-3 pl-12 pr-12 text-foreground shadow-xs placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/12"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear property search"
            className="absolute right-3 top-1/2 flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  );
};
