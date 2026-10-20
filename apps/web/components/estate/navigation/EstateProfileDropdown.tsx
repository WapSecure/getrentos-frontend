'use client';

import { Users } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface EstateProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

const LINKS = [
  { href: ROUTES.ESTATE_HOUSEHOLDS, label: 'Households', icon: Users },
];

export const EstateProfileDropdown = ({ user }: EstateProfileDropdownProps) => {
  return <AccountMenu user={user} roleId="estate" roleLabel="Estate manager" links={LINKS} />;
};
