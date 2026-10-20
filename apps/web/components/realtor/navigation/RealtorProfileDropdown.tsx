'use client';

import { HelpCircle, Settings, Shield, Users } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface RealtorProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

const LINKS = [
  { href: ROUTES.REALTOR_SETTINGS, label: 'Settings', icon: Settings },
  { href: ROUTES.REALTOR_CLIENTS, label: 'My clients', icon: Users },
  { href: ROUTES.REALTOR_TRUST_PROFILE, label: 'Trust profile', icon: Shield },
  { href: ROUTES.REALTOR_HELP, label: 'Help centre', icon: HelpCircle },
];

export const RealtorProfileDropdown = ({ user }: RealtorProfileDropdownProps) => {
  return <AccountMenu user={user} roleId="realtor" roleLabel="Realtor" links={LINKS} />;
};
