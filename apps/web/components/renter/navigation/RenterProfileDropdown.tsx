'use client';

import { HelpCircle, Settings, Star } from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface RenterProfileDropdownProps {
  user: { fullName: string; email: string; role?: string; roles?: string[] } | null;
}

const LINKS = [
  { href: ROUTES.RENTER_SETTINGS, label: 'Settings', icon: Settings },
  { href: ROUTES.RENTER_TRUST_SCORE, label: 'Trust & verification', icon: Star },
  { href: ROUTES.RENTER_HELP, label: 'Help centre', icon: HelpCircle },
];

export const RenterProfileDropdown = ({ user }: RenterProfileDropdownProps) => {
  return <AccountMenu user={user} roleId="renter" roleLabel="Renter" links={LINKS} />;
};
