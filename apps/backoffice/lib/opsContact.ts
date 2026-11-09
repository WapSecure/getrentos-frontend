export const OPS_CONTACT = {
  email: process.env.NEXT_PUBLIC_OPS_EMAIL?.trim() || 'support@getsureground.io',
  phone: process.env.NEXT_PUBLIC_OPS_ONCALL_PHONE?.trim() || '',
  hours: process.env.NEXT_PUBLIC_OPS_ONCALL_HOURS?.trim() || '',
};

export const telLink = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
