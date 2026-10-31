import { useSyncExternalStore } from 'react';
import { BACKEND_ROLE_TO_ID, getStoredUser, isAuthenticated } from '@getrentos/shared';

/**
 * The signed-in viewer's roles, as the client-side ids the UI reasons about
 * (`renter`, `buyer`, `landlord`, …).
 *
 * The stored session is inconsistent by nature: `role` already holds a client id
 * while `roles` holds backend enums, so both spellings have to resolve. Empty
 * when signed out.
 *
 * Reads storage, so components should use the hooks below (or an effect) rather
 * than calling it during render or in a lazy state initializer: either way the
 * first client render differs from the server's and hydration fails.
 */
export const viewerRoleIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  if (!isAuthenticated()) return [];

  const user = getStoredUser<{ role?: string; roles?: string[] }>();
  if (!user) return [];

  const roles = user.roles?.length ? user.roles : user.role ? [user.role] : [];
  return roles.map((role) => BACKEND_ROLE_TO_ID[role] ?? role);
};

/** True when the signed-in viewer holds at least one of `ids`. */
export const viewerHasRole = (...ids: string[]): boolean =>
  viewerRoleIds().some((role) => ids.includes(role));

/** True when anyone is signed in, whatever their role. */
export const viewerIsSignedIn = (): boolean => isAuthenticated();

const noSubscribe = () => () => undefined;
const signedOutOnServer = () => false;

/**
 * Whether anyone is signed in, safe to render with. The server snapshot is
 * "signed out", so hydration matches the server HTML and React re-renders with
 * the stored session straight afterwards.
 */
export const useViewerSignedIn = (): boolean =>
  useSyncExternalStore(noSubscribe, viewerIsSignedIn, signedOutOnServer);

/** `viewerHasRole` as a hydration-safe hook (false during the server render). */
export const useViewerHasRole = (...ids: string[]): boolean =>
  useSyncExternalStore(noSubscribe, () => viewerHasRole(...ids), signedOutOnServer);

export type ViewerKind = 'buyer' | 'member' | 'anonymous';

/** A buyer, another signed-in member, or an anonymous visitor (anonymous on the server). */
export const useBuyerViewer = (): ViewerKind => {
  const isBuyer = useViewerHasRole('buyer');
  const signedIn = useViewerSignedIn();
  return isBuyer ? 'buyer' : signedIn ? 'member' : 'anonymous';
};
