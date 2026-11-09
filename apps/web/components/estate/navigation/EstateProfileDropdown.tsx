'use client';

import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface EstateProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

/**
 * The account menu holds account things only. Households and the rest of the
 * estate's work live in the sidebar; estates have no settings or help page yet.
 */
export const EstateProfileDropdown = ({ user }: EstateProfileDropdownProps) => {
  return <AccountMenu user={user} roleId="estate" roleLabel="Estate manager" />;
};
