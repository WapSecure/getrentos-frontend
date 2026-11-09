// Surfaces stay hidden until the env numbers are set: never ship placeholder numbers.
export const SUPPORT = {
  phone: process.env.EXPO_PUBLIC_SUPPORT_PHONE?.trim() || '',
  /** Digits only, country code first (e.g. 2348012345678). */
  whatsapp: process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP?.trim().replace(/\D/g, '') || '',
  hours: process.env.EXPO_PUBLIC_SUPPORT_HOURS?.trim() || '',
  email: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@getsureground.io',
};

export const hasSupportLine = () => !!(SUPPORT.phone || SUPPORT.whatsapp);

export const telUrl = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const whatsappUrl = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
