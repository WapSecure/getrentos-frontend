'use client';

import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface EstateProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

export const EstateProfileDropdown = ({ user }: EstateProfileDropdownProps) => {
  return <AccountMenu user={user} roleId="estate" roleLabel="Estate manager" />;
};
