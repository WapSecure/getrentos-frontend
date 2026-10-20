'use client';

import { Search } from 'lucide-react';
import { SearchInput } from '@getrentos/ui';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface HelpHeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
}

export const HelpHeader = ({ searchQuery, onSearch }: HelpHeaderProps) => {
  return (
    <RenterPageHeader
      eyebrow="Support and guidance"
      icon={Search}
      title="Help centre"
      description="Find clear answers, step-by-step guides, and the right support for your renter journey."
    >
      <SearchInput
        value={searchQuery}
        onValueChange={onSearch}
        label="Search help centre"
        placeholder="Search for help articles, guides, or FAQs..."
        className="max-w-3xl"
      />
    </RenterPageHeader>
  );
};
