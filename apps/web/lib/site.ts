export const SITE_NAME = 'Sureground';
export const SITE_DESCRIPTION =
  'Property services for renters, landlords, owners, buyers, realtors and agents, with verified identities, verified properties and protected payments.';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://getsureground.io').replace(
  /\/$/,
  ''
);

export const SITE_TWITTER_HANDLE = '@sureground';

export const SITE_OG_IMAGE = `${SITE_URL}/opengraph-image`;

/** Page-level openGraph replaces the root one in Next.js, image included, so every page passes this. */
export const SITE_OG_IMAGES = [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }];
