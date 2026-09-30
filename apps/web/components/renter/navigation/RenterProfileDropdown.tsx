'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings, HelpCircle, LogOut, Star } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { logoutSession } from '@/lib/apiClient';
import { RoleSwitcher } from '@/components/shared/navigation/RoleSwitcher';

interface RenterProfileDropdownProps {
  user: { fullName: string; email: string; role?: string; roles?: string[] } | null;
}

export const RenterProfileDropdown = ({ user }: RenterProfileDropdownProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSignOut = async () => {
    await logoutSession();
    router.push(ROUTES.LOGIN);
  };

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const lastName = user?.fullName?.split(' ')[1] || '';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open renter account menu"
        aria-expanded={isOpen}
        aria-controls="renter-profile-menu"
        className="flex min-h-11 items-center gap-3 rounded-xl p-1.5 pr-2 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          {initials || 'U'}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-foreground">
            {firstName} {lastName}
          </p>
          <p className="text-xs text-muted-foreground">Renter</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="renter-profile-menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl"
          >
            <div className="border-b border-border/70 bg-secondary/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {initials || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email || 'Renter account'}
                  </p>
                </div>
              </div>
            </div>

            <RoleSwitcher currentRoleId="renter" />

            <div className="space-y-1 p-2">
              <Link
                href={ROUTES.RENTER_SETTINGS}
                className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <Link
                href={ROUTES.RENTER_TRUST_SCORE}
                className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                onClick={() => setIsOpen(false)}
              >
                <Star className="w-4 h-4" />
                Trust score details
              </Link>
              <Link
                href={ROUTES.RENTER_HELP}
                className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                onClick={() => setIsOpen(false)}
              >
                <HelpCircle className="w-4 h-4" />
                Help centre
              </Link>
            </div>

            <div className="border-t border-border/70 p-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/15"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
