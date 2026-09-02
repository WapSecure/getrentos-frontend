'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@getrentos/ui';
import { ResidentProfileDropdown } from './ResidentProfileDropdown';
import { residentNavItems } from './ResidentSidebar';

interface ResidentNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const ResidentNavbar = ({ user }: ResidentNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-background/75'
            : 'border-b border-border/50 bg-background/75 backdrop-blur-xl supports-backdrop-filter:bg-background/60'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" />

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <ResidentProfileDropdown user={user} />

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-secondary"
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
            className="fixed top-16 left-0 right-0 z-[60] bg-background border-b border-border lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="flex flex-col p-4 space-y-1">
              {residentNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
