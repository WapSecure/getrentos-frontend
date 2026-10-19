'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';

import { adminFieldService, type FieldAgentCandidate } from '@/services/adminManagedService';

const describe = (c: FieldAgentCandidate) => {
  const load = `${c.openVisits}/${c.maxOpenVisits} open`;
  if (c.atCapacity) return `${c.name ?? 'Agent'} · full (${load})`;
  return `${c.name ?? 'Agent'} · ${c.covers ? 'covers this area' : 'outside their area'} · ${load}`;
};

/**
 * Who goes to a property. With a field team set up, the team is offered best
 * first (covering the area, with room, least loaded) and the top pick is
 * marked; without one, any staff member can be chosen.
 */
export const FieldAssigneeSelect = ({
  propertyId,
  value,
  onValueChange,
  staffOptions,
  ariaLabel,
}: {
  propertyId: string;
  value: string;
  onValueChange: (value: string) => void;
  staffOptions: { value: string; label: string }[];
  ariaLabel: string;
}) => {
  const suggestions = useQuery({
    queryKey: ['admin', 'field', 'suggest', propertyId],
    queryFn: () => unwrap(adminFieldService.suggest(propertyId)),
    enabled: Boolean(propertyId),
  });

  const options = useMemo(() => {
    const ranked = suggestions.data ?? [];
    if (ranked.length === 0) return staffOptions;
    return ranked.map((c, i) => ({
      value: c.userId,
      label: `${i === 0 && c.covers && !c.atCapacity ? 'Suggested: ' : ''}${describe(c)}`,
    }));
  }, [suggestions.data, staffOptions]);

  return (
    <Select
      ariaLabel={ariaLabel}
      value={value}
      onValueChange={onValueChange}
      options={[{ value: '', label: 'Choose who goes…' }, ...options]}
    />
  );
};
