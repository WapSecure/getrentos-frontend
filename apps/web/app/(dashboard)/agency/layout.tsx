'use client';

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CustodyProvider } from '@/components/agency/CustodyProvider';
import { CustodyBar } from '@/components/agency/CustodyBar';
import { AgencyVerificationBanner } from '@/components/agency/AgencyVerificationBanner';
import {
  AgencyLoadingState,
  AgencyNotMemberState,
  AgencyPlainHeader,
  useAgencyMembership,
  usesOwnerWorkspace,
} from '@/components/agency/AgencyMembershipGate';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { ROUTES, STORAGE_KEYS, isAuthenticated } from '@/lib/constants/auth';
import { currentPath, withNext } from '@/lib/nextPath';

type NavbarUser = { fullName: string; email: string; roles?: string[] };

// The raw string is the snapshot so it stays referentially stable.
const subscribeToStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};
const readStoredUserRaw = () =>
  localStorage.getItem(STORAGE_KEYS.USER) ?? sessionStorage.getItem(STORAGE_KEYS.USER);
const subscribeToNothing = () => () => {};
const readSignedOut = () => !readStoredUserRaw() && !isAuthenticated();

const OUTSIDE_CUSTODY = ['/agency/setup', '/agency/join'];

export default function AgencyLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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

  // Redirect before any API call: a refused call would read as an expired session.
  const signedOut = useSyncExternalStore(subscribeToStorage, readSignedOut, () => false);
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
  useEffect(() => {
    if (!signedOut) return;
    const reason = pathname?.startsWith('/agency/join') ? { reason: 'invite' } : undefined;
    router.replace(withNext(ROUTES.LOGIN, currentPath(), reason));
  }, [signedOut, pathname, router]);

  if (!hydrated || signedOut) return <AgencyLoadingState />;

  return (
    <CustodyProvider>
      <AgencyShell user={user} outsideCustody={outsideCustody}>
        {children}
      </AgencyShell>
    </CustodyProvider>
  );
}

function AgencyShell({
  user,
  outsideCustody,
  children,
}: {
  user: NavbarUser | null;
  outsideCustody: boolean;
  children: ReactNode;
}) {
  const membership = useAgencyMembership(!outsideCustody);
  const blocked = membership === 'not-member';
  const ownerWorkspace = usesOwnerWorkspace(user?.roles);

  return (
    <>
      {ownerWorkspace ? (
        <LandlordNavbar user={user} />
      ) : (
        <AgencyPlainHeader user={user} showAssistant={membership === 'member'} />
      )}
      <div className="flex min-h-screen flex-col">
        {!blocked && <AgencyVerificationBanner />}
        {!outsideCustody && membership !== 'loading' && !blocked && <CustodyBar />}
        <main id="main-content" tabIndex={-1} className="flex-1">
          {blocked ? (
            <AgencyNotMemberState roles={user?.roles} />
          ) : membership === 'loading' ? (
            <AgencyLoadingState />
          ) : (
            children
          )}
        </main>
      </div>
    </>
  );
}
