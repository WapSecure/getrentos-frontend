'use client';

import { HelpCircle, Settings } from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface LandlordProfileDropdownProps {
  user: { fullName: string; email: string; roles?: string[] } | null;
  asManager?: boolean;
}

const LINKS = [
  { href: ROUTES.LANDLORD_SETTINGS, label: 'Settings', icon: Settings },
  { href: ROUTES.LANDLORD_HELP, label: 'Help centre', icon: HelpCircle },
];

export const LandlordProfileDropdown = ({
  user,
  asManager = false,
}: LandlordProfileDropdownProps) => (
  <AccountMenu
    user={user}
    roleId={asManager ? 'manager' : 'landlord'}
    roleLabel={asManager ? 'Property manager' : 'Landlord'}
    links={LINKS}
  />
);
