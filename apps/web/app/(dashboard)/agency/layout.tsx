'use client';

import { useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { CustodyProvider } from '@/components/agency/CustodyProvider';
import { CustodyBar } from '@/components/agency/CustodyBar';
import { AgencyVerificationBanner } from '@/components/agency/AgencyVerificationBanner';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { STORAGE_KEYS } from '@/lib/constants/auth';

type NavbarUser = { fullName: string; email: string; roles?: string[] };

// The signed-in profile lives in browser storage, outside React: read it during
// render (as CustodyProvider does) rather than copying it into state from an
// effect. The raw string is the snapshot so it stays referentially stable.
const subscribeToStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};
const readStoredUserRaw = () =>
  localStorage.getItem(STORAGE_KEYS.USER) ?? sessionStorage.getItem(STORAGE_KEYS.USER);

/**
 * The agency shell.
 *
 * A firm's portal is not an owner's portal with a different label. An owner looks
 * at everything they have; a manager looks at one client's things at a time, on
 * that client's instruction. So the shell is built around custody rather than
 * around a portfolio: the provider holds which client is selected, and the bar
 * states it on every screen inside here.
 *
 * Mounted once, at the layout, so the selection cannot disagree between two pages
 * and the bar cannot be forgotten by a page that was added later.
 *
 * Above it sits the same top bar as the owner workspace a manager works in, so a
 * firm's staff have their notifications, account menu and sign-out here too.
 */
/** Pages for joining or setting up a firm: no client is in play, so no custody bar. */
const OUTSIDE_CUSTODY = ['/agency/setup', '/agency/join'];

export default function AgencyLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const outsideCustody = OUTSIDE_CUSTODY.some((p) => pathname?.startsWith(p));
  const raw = useSyncExternalStore(subscribeToStorage, readStoredUserRaw, () => null);
  const user = useMemo<NavbarUser | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as NavbarUser;
    } catch {
      return null;
    }
  }, [raw]);

  return (
    <CustodyProvider>
      <LandlordNavbar user={user} />
      <div className="flex min-h-screen flex-col">
        <AgencyVerificationBanner />
        {!outsideCustody && <CustodyBar />}
        <main className="flex-1">{children}</main>
      </div>
    </CustodyProvider>
  );
}
