'use client';

import { SearchInput } from '@getrentos/ui';

interface MessageSearchProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

export const MessageSearch = ({ searchTerm, onSearch }: MessageSearchProps) => {
  return (
    <SearchInput
      value={searchTerm}
      onValueChange={onSearch}
      label="Search conversations"
      placeholder="Search conversations..."
    />
  );
};
