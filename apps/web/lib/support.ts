// Anything left empty in the environment is not shown, so the app never displays a made-up number.
export const SUPPORT = {
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || '',
  whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || '',
  hours: process.env.NEXT_PUBLIC_SUPPORT_HOURS?.trim() || '',
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@getsureground.io',
};

export const telLink = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const hasSupportLine = () => Boolean(SUPPORT.phone || SUPPORT.whatsapp);

/** wa.me wants digits only, country code first. */
export const whatsappLink = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

// Mirrors the mobile helper.
export function nigerianWhatsappLink(phone?: string | null, text?: string): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  const intl = digits.startsWith('234')
    ? digits
    : digits.startsWith('0') && digits.length === 11
      ? `234${digits.slice(1)}`
      : null;
  return intl && intl.length === 13 ? whatsappLink(intl, text) : null;
}
