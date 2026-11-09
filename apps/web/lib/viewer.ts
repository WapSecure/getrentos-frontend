import { BACKEND_ROLE_TO_ID, getStoredUser, isAuthenticated } from '@sureground/shared';

// The stored `role` holds a client id but `roles` holds backend enums, so both resolve. Reads storage: call it from a lazy initializer or an effect, never during render.
export const viewerRoleIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  if (!isAuthenticated()) return [];

  const user = getStoredUser<{ role?: string; roles?: string[] }>();
  if (!user) return [];

  const roles = user.roles?.length ? user.roles : user.role ? [user.role] : [];
  return roles.map((role) => BACKEND_ROLE_TO_ID[role] ?? role);
};

export const viewerHasRole = (...ids: string[]): boolean =>
  viewerRoleIds().some((role) => ids.includes(role));

export const viewerIsSignedIn = (): boolean => isAuthenticated();
