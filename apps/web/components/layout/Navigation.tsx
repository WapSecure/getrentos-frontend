'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@getrentos/ui';
import { Logo } from '@/components/ui/Logo';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES, getDashboardRoute, getUserRole } from '@/lib/constants/auth';
import { useAuthStore } from '@/lib/store/authStore';

export const Navigation = () => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSignedIn = useAuthStore((s) => s.isAuthenticated);
  // Computed client-side only (localStorage is unavailable on the server).
  // The Dashboard link only renders once the reactive auth store flips to
  // signed-in — after hydration — so there is no SSR/client mismatch.
  const [dashboardHref] = useState<string>(() =>
    typeof window === 'undefined' ? ROUTES.DASHBOARD : getDashboardRoute(getUserRole() || 'renter')
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    // Sync auth state from storage into the reactive store on first paint.
    useAuthStore.getState().init();

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
              <Link
                href={ROUTES.LAND_MARKETPLACE}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Land
              </Link>
              <Link
                href={ROUTES.SHORTLET_MARKETPLACE}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Shortlets
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
                    href={dashboardHref}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <ThemeToggle />
                  <button
                    onClick={async () => {
                      await useAuthStore.getState().logout();
                      router.push(ROUTES.HOME);
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
              <Link
                href={ROUTES.LAND_MARKETPLACE}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Land
              </Link>
              <Link
                href={ROUTES.SHORTLET_MARKETPLACE}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Shortlets
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
                    href={dashboardHref}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      await useAuthStore.getState().logout();
                      router.push(ROUTES.HOME);
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
