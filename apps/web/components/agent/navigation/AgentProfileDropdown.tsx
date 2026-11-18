'use client';

import { HelpCircle, Settings, Shield } from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';
import { listAgentQueuedRecords } from '@/lib/agentQueueSync';

interface AgentProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

const LINKS = [
  { href: ROUTES.AGENT_SETTINGS, label: 'Settings', icon: Settings },
  { href: ROUTES.AGENT_TRUST_PROFILE, label: 'Trust & verification', icon: Shield },
  { href: ROUTES.AGENT_HELP, label: 'Help centre', icon: HelpCircle },
];

const unsentWorkWarning = async () => {
  const count = (await listAgentQueuedRecords()).length;
  if (count === 0) return null;
  return `${count} field record${count === 1 ? ' has' : 's have'} not uploaded yet. Signing out deletes ${count === 1 ? 'it' : 'them'} from this device. Go online and let ${count === 1 ? 'it' : 'them'} upload first if you need to keep ${count === 1 ? 'it' : 'them'}.`;
};

export const AgentProfileDropdown = ({ user }: AgentProfileDropdownProps) => {
  return (
    <AccountMenu
      user={user}
      roleId="agent"
      roleLabel="Field agent"
      links={LINKS}
      signOutWarning={unsentWorkWarning}
    />
  );
};
