'use client';

import { HelpCircle, Settings } from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface OwnerProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

const LINKS = [
  { href: ROUTES.OWNER_SETTINGS, label: 'Settings', icon: Settings },
  { href: ROUTES.OWNER_HELP, label: 'Help centre', icon: HelpCircle },
];

export const OwnerProfileDropdown = ({ user }: OwnerProfileDropdownProps) => {
  return <AccountMenu user={user} roleId="owner" roleLabel="Property owner" links={LINKS} />;
};
