'use client';

import { ClipboardList, HelpCircle, Settings, Shield } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

interface AgentProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

const LINKS = [
  { href: ROUTES.AGENT_SETTINGS, label: 'Settings', icon: Settings },
  { href: ROUTES.AGENT_TASKS, label: 'My tasks', icon: ClipboardList },
  { href: ROUTES.AGENT_TRUST_PROFILE, label: 'Trust profile', icon: Shield },
  { href: ROUTES.AGENT_HELP, label: 'Help centre', icon: HelpCircle },
];

export const AgentProfileDropdown = ({ user }: AgentProfileDropdownProps) => {
  return <AccountMenu user={user} roleId="agent" roleLabel="Field agent" links={LINKS} />;
};
