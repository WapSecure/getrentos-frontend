'use client';

import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { IconButton, SearchInput, ThemeToggle } from '@sureground/ui';
import { RoleMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import type { RoleNavigationConfig } from '@/lib/navigation/types';

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
}

export const WorkspaceNavbar = ({
  search,
  actions,
  assistant,
  notifications,
  profileMenu,
  navigation,
}: WorkspaceNavbarProps) => {
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
            <Logo size="md" className="shrink-0 [&>span]:sr-only sm:[&>span]:not-sr-only" />

            <div className="hidden md:flex flex-1 max-w-md mx-4">{searchBox}</div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
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
            <RoleMobileNavigation
              config={navigation}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
