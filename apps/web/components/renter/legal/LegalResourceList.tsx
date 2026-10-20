'use client';

import { useMemo, useState } from 'react';
import { ToggleChip } from '@getrentos/ui';
import { LEGAL_RESOURCES, type LegalResourceCategory } from '@/lib/content/legalResources';
import { LegalResourceCard } from './LegalResourceCard';

const categoryLabels: Record<LegalResourceCategory, string> = {
  rights: 'Tenant Rights',
  notice_periods: 'Notice Periods',
  deposits: 'Deposits',
  eviction_process: 'Eviction Process',
};

const categories = Object.keys(categoryLabels) as LegalResourceCategory[];

export const LegalResourceList = () => {
  const [activeCategory, setActiveCategory] = useState<LegalResourceCategory | 'all'>('all');

  const filtered = useMemo(
    () =>
      activeCategory === 'all'
        ? LEGAL_RESOURCES
        : LEGAL_RESOURCES.filter((resource) => resource.category === activeCategory),
    [activeCategory]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <ToggleChip
          size="sm"
          pressed={activeCategory === 'all'}
          onPressedChange={() => setActiveCategory('all')}
        >
          All
        </ToggleChip>
        {categories.map((category) => (
          <ToggleChip
            key={category}
            size="sm"
            pressed={activeCategory === category}
            onPressedChange={() => setActiveCategory(category)}
          >
            {categoryLabels[category]}
          </ToggleChip>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((resource) => (
          <LegalResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  );
};
