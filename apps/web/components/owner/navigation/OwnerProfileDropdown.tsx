'use client';

import { Building2, HelpCircle, Settings } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface OwnerProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

const LINKS = [
  { href: ROUTES.OWNER_SETTINGS, label: 'Settings', icon: Settings },
  { href: ROUTES.OWNER_PROPERTIES, label: 'My properties', icon: Building2 },
  { href: ROUTES.OWNER_HELP, label: 'Help centre', icon: HelpCircle },
];

export const OwnerProfileDropdown = ({ user }: OwnerProfileDropdownProps) => {
  return <AccountMenu user={user} roleId="owner" roleLabel="Property owner" links={LINKS} />;
};
