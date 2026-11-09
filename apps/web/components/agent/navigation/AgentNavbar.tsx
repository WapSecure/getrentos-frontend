'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff } from '@sureground/icons';
import { Badge } from '@sureground/ui';
import { AgentProfileDropdown } from './AgentProfileDropdown';
import { WorkspaceNavbar } from '@/components/shared/navigation/WorkspaceNavbar';
import { agentNavigation } from '@/lib/navigation/roles/agent';
import { ROUTES } from '@/lib/constants/auth';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { unwrap } from '@/lib/apiHelpers';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { AgentAssistant } from '../assistant/AgentAssistant';

interface AgentNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const AgentNavbar = ({ user }: AgentNavbarProps) => {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return (
    <WorkspaceNavbar
      search={{
        placeholder: 'Search tasks, properties...',
        label: 'Search tasks and properties',
        onSearch: (query) => router.push(`${ROUTES.AGENT_TASKS}?q=${encodeURIComponent(query)}`),
      }}
      actions={
        <Badge
          variant={isOnline ? 'success' : 'warning'}
          icon={isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          className="hidden sm:inline-flex"
        >
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      }
      assistant={<AgentAssistant />}
      notifications={
        <NotificationBell
          portal="agent"
          queryKey={agentKeys.notifications}
          fetchNotifications={() => unwrap(agentService.getNotifications())}
          markRead={(id) => unwrap(agentService.markNotificationRead(id))}
          markAllRead={() => unwrap(agentService.markAllNotificationsRead())}
          viewAllHref={ROUTES.AGENT_TASKS}
          viewAllLabel="View all tasks"
        />
      }
      profileMenu={<AgentProfileDropdown user={user} />}
      navigation={agentNavigation}
    />
  );
};
