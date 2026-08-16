'use client';

import { LegacyInput } from '@getrentos/ui';

import { Search, X } from 'lucide-react';

interface HelpHeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
}

export const HelpHeader = ({ searchQuery, onSearch }: HelpHeaderProps) => {
  const handleClear = () => {
    onSearch('');
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
          <p className="text-muted-foreground mt-1">Find answers, guides, and support resources</p>
        </div>
      </div>

      <div className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <LegacyInput
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search for help articles, guides, or FAQs..."
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
