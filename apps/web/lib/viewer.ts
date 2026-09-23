import { BACKEND_ROLE_TO_ID, getStoredUser, isAuthenticated } from '@getrentos/shared';

/**
 * The signed-in viewer's roles, as the client-side ids the UI reasons about
 * (`renter`, `buyer`, `landlord`, …).
 *
 * The stored session is inconsistent by nature: `role` already holds a client id
 * while `roles` holds backend enums, so both spellings have to resolve. Empty
 * when signed out.
 *
 * Reads storage, so call it from a lazy state initializer or an effect — never
 * during render, or the server and client render different things.
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
