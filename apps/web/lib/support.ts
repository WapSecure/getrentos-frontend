/**
 * How guests reach a person. Set in the environment; anything left empty is
 * simply not shown, so the app never displays a made-up number.
 *
 *   NEXT_PUBLIC_SUPPORT_PHONE     e.g. +2348000000000 (calls)
 *   NEXT_PUBLIC_SUPPORT_WHATSAPP  e.g. +2348000000000 (WhatsApp chat)
 *   NEXT_PUBLIC_SUPPORT_HOURS     e.g. "Every day, 7am to 11pm"
 */
export const SUPPORT = {
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || '',
  whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || '',
  hours: process.env.NEXT_PUBLIC_SUPPORT_HOURS?.trim() || '',
};

export const hasSupportLine = () => Boolean(SUPPORT.phone || SUPPORT.whatsapp);

/** wa.me wants digits only, country code first. */
export const whatsappLink = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
