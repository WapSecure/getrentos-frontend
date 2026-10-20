'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Wifi, WifiOff } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import {
  Badge,
  IconButton,
  SearchInput,
  ThemeToggle,
} from '@getrentos/ui';
import { AgentProfileDropdown } from './AgentProfileDropdown';
import { navGroups } from '../dashboard/AgentSidebar';
import { GroupedMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { ROUTES } from '@/lib/constants/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { unwrap } from '@/lib/apiHelpers';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';

interface AgentNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const AgentNavbar = ({ user }: AgentNavbarProps) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`${ROUTES.AGENT_TASKS}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-background/75'
            : 'border-b border-border/50 bg-background/75 backdrop-blur-xl supports-backdrop-filter:bg-background/60'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" />

            <div className="hidden md:flex items-center gap-6">
              <Link
                href={ROUTES.AGENT_TASKS}
                className="text-foreground font-medium hover:text-primary transition-colors"
              >
                Tasks
              </Link>
              <Link
                href={ROUTES.AGENT_SYNC}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Sync Center
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchInput
                value={searchQuery}
                onValueChange={setSearchQuery}
                onKeyDown={handleSearchSubmit}
                placeholder="Search tasks, properties..."
                label="Search tasks and properties"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant={isOnline ? 'success' : 'warning'}
                icon={isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                className="hidden sm:inline-flex"
              >
                {isOnline ? 'Online' : 'Offline'}
              </Badge>

              <ThemeToggle />

              <NotificationBell
                portal="agent"
                queryKey={agentKeys.notifications}
                fetchNotifications={() => unwrap(agentService.getNotifications())}
                markRead={(id) => unwrap(agentService.markNotificationRead(id))}
                markAllRead={() => unwrap(agentService.markAllNotificationsRead())}
                viewAllHref={ROUTES.AGENT_TASKS}
                viewAllLabel="View all tasks"
              />

              <AgentProfileDropdown user={user} />

              <IconButton
                label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                icon={isMobileMenuOpen ? <X /> : <Menu />}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden"
              />
            </div>
          </div>

          <div className="md:hidden py-3">
            <SearchInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyDown={handleSearchSubmit}
              placeholder="Search tasks, properties..."
              label="Search tasks and properties"
            />
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-[60] bg-background border-b border-border lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <GroupedMobileNavigation
              ariaLabel="Agent navigation"
              dashboardHref={ROUTES.AGENT_DASHBOARD}
              onNavigate={() => setIsMobileMenuOpen(false)}
              groups={navGroups.map((group) => ({
                ...group,
                items: group.items.map((item) => ({
                  ...item,
                  label: item.labelKey ? t(item.labelKey) : item.label,
                })),
              }))}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
