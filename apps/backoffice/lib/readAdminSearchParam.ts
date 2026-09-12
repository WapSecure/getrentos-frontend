/** Read-only URL seed for register filters after a global-search navigation. */
export function readAdminSearchParam(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('search') ?? '';
}
