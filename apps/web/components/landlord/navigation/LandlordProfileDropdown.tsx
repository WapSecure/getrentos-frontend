'use client';

import { HelpCircle, Settings } from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface LandlordProfileDropdownProps {
  user: { fullName: string; email: string; roles?: string[] } | null;
}

const LINKS = [
  { href: ROUTES.LANDLORD_SETTINGS, label: 'Settings', icon: Settings },
  { href: ROUTES.LANDLORD_HELP, label: 'Help centre', icon: HelpCircle },
];

export const LandlordProfileDropdown = ({ user }: LandlordProfileDropdownProps) => {
  // A firm's manager works in this same workspace for their clients.
  const roleLabel =
    user?.roles?.includes('PROPERTY_MANAGER') && !user.roles.includes('LANDLORD')
      ? 'Property manager'
      : 'Landlord';
  return <AccountMenu user={user} roleId="landlord" roleLabel={roleLabel} links={LINKS} />;
};
