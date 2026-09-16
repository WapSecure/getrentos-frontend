export * from '@getrentos/shared';

/**
 * Web-only routes for the estate marketplace.
 *
 * Kept here rather than in `@getrentos/shared`'s ROUTES because they only mean
 * anything to this app — the backoffice and the native app have no estate
 * marketplace console. Move them into the shared map if that changes.
 */
export const ESTATE_MARKETPLACE_ROUTES = {
  /** The estate's own console: properties it represents, and its listings. */
  ESTATE_MARKETPLACE: '/estate/marketplace',
  /** The property owner's inbox of requests from estates. */
  OWNER_ESTATE_AGREEMENTS: '/owner/estate-agreements',
  /** Public directory of estates. */
  ESTATES_DIRECTORY: '/estates',
} as const;
