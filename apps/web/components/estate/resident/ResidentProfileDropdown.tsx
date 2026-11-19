'use client';

import { Settings } from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface ResidentProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

export const ResidentProfileDropdown = ({ user }: ResidentProfileDropdownProps) => {
  return (
    <AccountMenu
      user={user}
      roleId="resident"
      roleLabel="Resident"
      links={[{ href: ROUTES.RESIDENT_SETTINGS, label: 'Settings', icon: Settings }]}
    />
  );
};
