'use client';

import { useState } from 'react';
import { SearchInput } from '@getrentos/ui';

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

  const handleChange = (value: string) => {
    setQuery(value);
    if (value === '') onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} role="search">
      <SearchInput
        value={query}
        onValueChange={handleChange}
        label="Search properties"
        placeholder="Search by area, property or landmark"
      />
    </form>
  );
};
