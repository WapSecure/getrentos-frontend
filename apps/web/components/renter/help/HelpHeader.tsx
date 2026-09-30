'use client';

import { LegacyInput } from '@getrentos/ui';

import { Search, X } from 'lucide-react';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface HelpHeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
}

export const HelpHeader = ({ searchQuery, onSearch }: HelpHeaderProps) => {
  const handleClear = () => {
    onSearch('');
  };

  return (
    <RenterPageHeader
      eyebrow="Support and guidance"
      icon={Search}
      title="Help centre"
      description="Find clear answers, step-by-step guides, and the right support for your renter journey."
    >
      <div className="relative max-w-3xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <LegacyInput
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search for help articles, guides, or FAQs..."
          aria-label="Search help centre"
          className="w-full rounded-xl border border-border bg-background/80 py-3 pl-12 pr-11 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            type="button"
            aria-label="Clear help search"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </RenterPageHeader>
  );
};
