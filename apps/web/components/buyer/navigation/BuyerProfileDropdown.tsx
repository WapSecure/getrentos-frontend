'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, Settings, HelpCircle, LogOut, Shield, Heart } from 'lucide-react';
import { ROUTES, STORAGE_KEYS } from '@/lib/constants/auth';
import { getInitials } from '@/lib/format';

interface BuyerProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

export const BuyerProfileDropdown = ({ user }: BuyerProfileDropdownProps) => {
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

  const handleSignOut = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    router.push(ROUTES.LOGIN);
  };

  const fullName = user?.fullName || 'User';
  const initials = getInitials(fullName);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] flex items-center justify-center text-[#0a1a1f] font-semibold text-sm">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{fullName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Property Buyer</p>
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
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a2a2f] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{fullName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
            </div>

            <div className="py-2">
              <Link
                href="/buyer/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                My Profile
              </Link>
              <Link
                href="/buyer/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <Link
                href="/buyer/saved"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Heart className="w-4 h-4" />
                Saved Properties
              </Link>
              <Link
                href="/buyer/trust-profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Shield className="w-4 h-4" />
                Trust Profile
              </Link>
              <Link
                href="/help"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <HelpCircle className="w-4 h-4" />
                Help Center
              </Link>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 py-2">
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
