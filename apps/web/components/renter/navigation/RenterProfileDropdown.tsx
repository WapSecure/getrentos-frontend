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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-secondary transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm">
          {initials || 'U'}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-foreground">
            {firstName} {lastName}
          </p>
          <p className="text-xs text-muted-foreground">Renter</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-lg border border-border z-50"
          >
            <div className="p-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">{user?.fullName || 'User'}</p>
              <p className="text-xs text-muted-foreground">Renter</p>
            </div>

            <RoleSwitcher currentRoleId="renter" />

            <div className="py-2">
              <Link
                href={ROUTES.RENTER_SETTINGS}
                className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <Link
                href={ROUTES.RENTER_TRUST_SCORE}
                className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Star className="w-4 h-4" />
                Trust Score Details
              </Link>
              <Link
                href={ROUTES.RENTER_HELP}
                className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <HelpCircle className="w-4 h-4" />
                Help Center
              </Link>
            </div>

            <div className="border-t border-border py-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
