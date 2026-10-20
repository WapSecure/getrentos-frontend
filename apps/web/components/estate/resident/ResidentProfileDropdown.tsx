'use client';

import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface ResidentProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

export const ResidentProfileDropdown = ({ user }: ResidentProfileDropdownProps) => {
  return <AccountMenu user={user} roleId="resident" roleLabel="Resident" />;
};
