'use client';

import { Heart, HelpCircle, Settings, Shield } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface BuyerProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

const LINKS = [
  { href: ROUTES.BUYER_SETTINGS, label: 'Settings', icon: Settings },
  { href: ROUTES.BUYER_SAVED, label: 'Saved properties', icon: Heart },
  { href: ROUTES.BUYER_TRUST_PROFILE, label: 'Trust profile', icon: Shield },
  { href: ROUTES.BUYER_HELP, label: 'Help centre', icon: HelpCircle },
];

export const BuyerProfileDropdown = ({ user }: BuyerProfileDropdownProps) => {
  return <AccountMenu user={user} roleId="buyer" roleLabel="Property buyer" links={LINKS} />;
};
