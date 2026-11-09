'use client';

import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { IconButton, SearchInput, ThemeToggle } from '@sureground/ui';
import {
  GroupedMobileNavigation,
  type GroupedSidebarGroup,
  type GroupedSidebarItem,
} from '@/components/shared/dashboard/GroupedSidebar';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';

/** A sidebar group whose items may name their label by translation key. */
export interface WorkspaceNavbarGroup extends Omit<GroupedSidebarGroup, 'items'> {
  items: (GroupedSidebarItem & { labelKey?: TranslationKey })[];
}

interface WorkspaceNavbarProps {
  search: {
    placeholder: string;
    /** The search box's accessible name; SearchInput falls back to "Search". */
    label?: string;
    /** Called with the trimmed query when Enter is pressed on a non-empty box. */
    onSearch: (query: string) => void;
  };
  /** Extra items shown before the theme toggle, such as a status badge. */
  actions?: ReactNode;
  assistant: ReactNode;
  notifications: ReactNode;
  profileMenu: ReactNode;
  /** What the phone and tablet drawer renders through GroupedMobileNavigation. */
  navigation: {
    ariaLabel: string;
    workspaceLabel: string;
    dashboardHref: string;
    groups: WorkspaceNavbarGroup[];
  };
}

/**
 * The top bar shared by the landlord, owner, realtor, agent and buyer
 * workspaces: logo, search, the role's assistant, notifications and profile
 * menu, plus the drawer that carries the sidebar's links below `lg`.
 */
export const WorkspaceNavbar = ({
  search,
  actions,
  assistant,
  notifications,
  profileMenu,
  navigation,
}: WorkspaceNavbarProps) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      search.onSearch(searchQuery.trim());
    }
  };

  const searchBox = (
    <SearchInput
      className="w-full"
      value={searchQuery}
      onValueChange={setSearchQuery}
      onKeyDown={handleSearchSubmit}
      placeholder={search.placeholder}
      label={search.label}
    />
  );

  return (
    <>
      <nav
        aria-label="Top bar"
        className={`workspace-navbar sticky top-0 z-50 ${isScrolled ? 'shadow-xs' : ''}`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Logo size="md" />

            <div className="hidden md:flex flex-1 max-w-md mx-4">{searchBox}</div>

            <div className="flex items-center gap-3">
              {actions}
              <ThemeToggle />
              {assistant}
              {notifications}
              {profileMenu}

              <IconButton
                label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden"
                icon={isMobileMenuOpen ? <X /> : <Menu />}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </div>

          <div className="md:hidden py-3">{searchBox}</div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-[60] bg-background border-b border-border lg:hidden bottom-0 overflow-y-auto overscroll-contain"
          >
            {/* GroupedMobileNavigation closes on Escape and hands focus back to
                the menu button; onNavigate also closes the drawer on a link. */}
            <GroupedMobileNavigation
              ariaLabel={navigation.ariaLabel}
              workspaceLabel={navigation.workspaceLabel}
              dashboardHref={navigation.dashboardHref}
              onNavigate={() => setIsMobileMenuOpen(false)}
              groups={navigation.groups.map((group) => ({
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
