'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, User, Settings, HelpCircle, LogOut, Shield, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { ROUTES, STORAGE_KEYS } from '@/lib/constants/auth';
import { getInitials } from '@/lib/format';

interface AdminProfileDropdownProps {
  user: { fullName: string; email: string } | null;
}

export const AdminProfileDropdown = ({ user }: AdminProfileDropdownProps) => {
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    router.push(ROUTES.LOGIN);
  };

  const fullName = user?.fullName || 'User';
  const initials = getInitials(fullName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-secondary transition-colors outline-none data-[state=open]:bg-secondary">
        <div className="w-8 h-8 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-foreground">{fullName}</p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p className="text-sm font-semibold text-foreground">{fullName}</p>
          <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/admin/settings">
            <User className="w-4 h-4" />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/settings">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/users">
            <Users className="w-4 h-4" />
            User Management
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/audit-logs">
            <Shield className="w-4 h-4" />
            Audit Logs
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/help">
            <HelpCircle className="w-4 h-4" />
            Help Center
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
