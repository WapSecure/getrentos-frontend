'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES, isAuthenticated } from '@/lib/constants/auth';
import { clearAuthSession } from '@/lib/authStorage';

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSignedIn(isAuthenticated());

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />

            <div className="hidden md:flex items-center gap-8">
              <Link
                href="#roles"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Roles
              </Link>
              <Link
                href="#how-it-works"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                How it works
              </Link>
              <Link
                href={ROUTES.HOME_MANAGEMENT}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Home Management
              </Link>
              {!isSignedIn ? (
                <>
                  <Link
                    href={ROUTES.LOGIN}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>
                  <ThemeToggle />
                  <Link
                    href={ROUTES.SIGNUP}
                    className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors"
                  >
                    Get early access
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={ROUTES.DASHBOARD}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <ThemeToggle />
                  <button
                    onClick={() => {
                      clearAuthSession();
                      setIsSignedIn(false);
                      window.location.href = ROUTES.HOME;
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 md:hidden">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-background border-b border-border md:hidden"
          >
            <div className="flex flex-col p-4 space-y-3">
              <Link
                href="#roles"
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Roles
              </Link>
              <Link
                href="#how-it-works"
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How it works
              </Link>
              <Link
                href={ROUTES.HOME_MANAGEMENT}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home Management
              </Link>
              {!isSignedIn ? (
                <>
                  <Link
                    href={ROUTES.LOGIN}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href={ROUTES.SIGNUP}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-center font-medium hover:bg-primary-hover transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get early access
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={ROUTES.DASHBOARD}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      clearAuthSession();
                      setIsSignedIn(false);
                      window.location.href = ROUTES.HOME;
                    }}
                    className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
