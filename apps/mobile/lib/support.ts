/**
 * The GetRentos support line. Numbers come from the build environment
 * (EXPO_PUBLIC_SUPPORT_PHONE, _WHATSAPP, _HOURS, _EMAIL) and every surface that shows
 * them stays hidden until they're set — we never ship placeholder numbers.
 */
export const SUPPORT = {
  phone: process.env.EXPO_PUBLIC_SUPPORT_PHONE?.trim() || '',
  /** Digits only, country code first (e.g. 2348012345678). */
  whatsapp: process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP?.trim().replace(/\D/g, '') || '',
  hours: process.env.EXPO_PUBLIC_SUPPORT_HOURS?.trim() || '',
  /** The public support inbox (same address the web footer shows). */
  email: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@getrentos.com',
};

export const hasSupportLine = () => !!(SUPPORT.phone || SUPPORT.whatsapp);

export const telUrl = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const whatsappUrl = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
