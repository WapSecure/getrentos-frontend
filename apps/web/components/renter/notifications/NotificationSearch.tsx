'use client';

import { SearchInput } from '@sureground/ui';

interface NotificationSearchProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

export const NotificationSearch = ({ searchTerm, onSearch }: NotificationSearchProps) => {
  return (
    <SearchInput
      value={searchTerm}
      onValueChange={onSearch}
      label="Search notifications"
      placeholder="Search notifications..."
    />
  );
};
