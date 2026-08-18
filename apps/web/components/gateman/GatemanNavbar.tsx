'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';
import { logoutSession } from '@/lib/apiClient';

interface GatemanNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const GatemanNavbar = ({ user }: GatemanNavbarProps) => {
  const router = useRouter();

  const handleSignOut = async () => {
    await logoutSession();
    router.push(ROUTES.LOGIN);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">{user?.fullName}</span>
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
