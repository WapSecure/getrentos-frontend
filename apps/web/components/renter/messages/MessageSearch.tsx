'use client';

import { LegacyInput } from '@getrentos/ui';

import { Search, X } from 'lucide-react';

interface MessageSearchProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

export const MessageSearch = ({ searchTerm, onSearch }: MessageSearchProps) => {
  const handleClear = () => {
    onSearch('');
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <LegacyInput
        type="text"
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search conversations..."
        className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      {searchTerm && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
