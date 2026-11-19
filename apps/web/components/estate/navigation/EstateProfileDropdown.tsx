'use client';

import { Settings } from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface EstateProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

export const EstateProfileDropdown = ({ user }: EstateProfileDropdownProps) => {
  return (
    <AccountMenu
      user={user}
      roleId="estate"
      roleLabel="Estate manager"
      links={[{ href: ROUTES.ESTATE_SETTINGS, label: 'Settings', icon: Settings }]}
    />
  );
};
