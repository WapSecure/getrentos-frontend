'use client';

import { MapPin } from '@sureground/icons';
import { Alert } from '@sureground/ui';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';

export const RegionScopeNotice = ({ what }: { what: string }) => {
  const regions = useAdminUser()?.regions ?? [];
  if (regions.length === 0) return null;
  return (
    <Alert variant="neutral" icon={MapPin} className="mb-4">
      You see {what} in {regions.join(', ')} only. Ask an officer who covers other states for
      anything outside them.
    </Alert>
  );
};
