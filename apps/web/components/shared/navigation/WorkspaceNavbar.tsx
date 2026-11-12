'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X } from '@sureground/icons';
import { Logo } from '@/components/ui/Logo';
import { IconButton, SearchInput, ThemeToggle } from '@sureground/ui';
import { RoleMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import type { NavigationGates, RoleNavigationConfig } from '@/lib/navigation/types';
import {
  SearchShortcutHint,
  TopBarAccount,
  TopBarDivider,
  WorkspacePill,
  useSlashToSearch,
} from './TopBarParts';

interface WorkspaceNavbarProps {
  search: {
    placeholder: string;
    label?: string;
    onSearch: (query: string) => void;
  };
  actions?: ReactNode;
  assistant: ReactNode;
  notifications: ReactNode;
  profileMenu: ReactNode;
  navigation: RoleNavigationConfig;
  navigationGates?: NavigationGates;
}

export const WorkspaceNavbar = ({
  search,
  actions,
  assistant,
  notifications,
  profileMenu,
  navigation,
  navigationGates,
}: WorkspaceNavbarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  useSlashToSearch(barRef);

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
        ref={barRef}
        aria-label="Top bar"
        className={`workspace-navbar sticky top-0 z-50 transition-shadow duration-200 ${isScrolled ? 'shadow-xs' : ''}`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 shrink-0 items-center gap-3">
              <Logo size="md" className="shrink-0 [&>span]:sr-only sm:[&>span]:not-sr-only" />
              <TopBarDivider className="hidden lg:block" />
              <WorkspacePill label={navigation.workspaceLabel} className="hidden lg:inline-flex" />
            </div>

            <div className="shell-search group relative mx-4 hidden max-w-md flex-1 md:flex">
              {searchBox}
              <SearchShortcutHint />
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              {actions}
              <ThemeToggle />
              {assistant}
              {notifications}
              <TopBarDivider className="mx-1 hidden sm:block" />
              <TopBarAccount>{profileMenu}</TopBarAccount>

              <IconButton
                label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden"
                icon={isMobileMenuOpen ? <X /> : <Menu />}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </div>

          <div className="pb-3 md:hidden">{searchBox}</div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            className="fixed top-16 left-0 right-0 z-[60] bg-background border-b border-border lg:hidden bottom-0 overflow-y-auto overscroll-contain"
          >
            <RoleMobileNavigation
              config={navigation}
              gates={navigationGates}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
