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

// The signed-in profile lives in browser storage, outside React: read it during
// render (as CustodyProvider does) rather than copying it into state from an
// effect. The raw string is the snapshot so it stays referentially stable.
const subscribeToStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};
const readStoredUserRaw = () =>
  localStorage.getItem(STORAGE_KEYS.USER) ?? sessionStorage.getItem(STORAGE_KEYS.USER);
const subscribeToNothing = () => () => {};
const readSignedOut = () => !readStoredUserRaw() && !isAuthenticated();

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

  // Nobody signed in: send them to sign in and back here, without calling the
  // API first (a refused call would read as an expired session). An invitation
  // link says why they are being asked to sign in.
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

/**
 * Someone outside any firm gets one clear "not a member" page on every agency
 * route, rather than each page's own refusal. Setting up or joining a firm is
 * open to anyone signed in.
 */
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
      {ownerWorkspace ? <LandlordNavbar user={user} /> : <AgencyPlainHeader user={user} />}
      <div className="flex min-h-screen flex-col">
        {!blocked && <AgencyVerificationBanner />}
        {!outsideCustody && membership !== 'loading' && !blocked && <CustodyBar />}
        <main className="flex-1">
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
