// Accounts can be phone-only. Mirrors the backend's `src/shared/phone/contact.ts`; the server decides.

export type ContactInput =
  | { kind: 'empty' }
  | { kind: 'email'; email: string }
  | { kind: 'phone'; e164: string }
  | { kind: 'invalid'; message: string };

const NG_NATIONAL_RE = /^[789]\d{9}$/;

// One `local@domain.tld` regex backtracks quadratically on a long run of dots, so check the parts.
function isEmailShape(value: string): boolean {
  if (!/^[^\s@]+@[^\s@]+$/.test(value)) return false;
  const domain = value.slice(value.indexOf('@') + 1);
  const dot = domain.indexOf('.', 1);
  return dot > 0 && dot < domain.length - 1;
}

export const CONTACT_INVALID_PHONE = 'Enter a valid phone number, for example 0803 123 4567.';
export const CONTACT_INVALID_EMAIL = 'Enter a valid email address.';

/** Nigerian numbers in any common form (0803…, 803…, 234803…, +234 803…) become +234 and ten digits; another country code (after + or 00) stays as E.164. */
export function toE164Phone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^[+\d\s().-]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, '');
  let international = trimmed.startsWith('+');
  if (!international && digits.startsWith('00')) {
    digits = digits.slice(2);
    international = true;
  }
  let national: string | null = null;
  if (digits.startsWith('234') && (international || digits.length >= 13)) {
    national = digits.slice(3);
    if (national.length === 11 && national.startsWith('0')) national = national.slice(1);
  } else if (international) {
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  } else if (digits.length === 10) {
    national = digits;
  }
  return national && NG_NATIONAL_RE.test(national) ? `+234${national}` : null;
}

export function sanitisePhoneInput(raw: string): string {
  return raw.replace(/[^\d\s().+-]/g, '').replace(/(?!^)\+/g, '');
}

/** Shows the whole number, so use it only for the person's own number. */
export function formatPhoneForDisplay(raw: string | null | undefined): string {
  const value = raw?.trim() ?? '';
  const e164 = toE164Phone(value);
  const ng = e164?.match(/^\+234(\d{3})(\d{3})(\d{4})$/);
  return ng ? `+234 ${ng[1]} ${ng[2]} ${ng[3]}` : value;
}

export function readContactInput(raw: string | null | undefined): ContactInput {
  const value = raw?.trim() ?? '';
  if (!value) return { kind: 'empty' };
  if (value.includes('@')) {
    return isEmailShape(value)
      ? { kind: 'email', email: value }
      : { kind: 'invalid', message: CONTACT_INVALID_EMAIL };
  }
  const e164 = toE164Phone(value);
  return e164 ? { kind: 'phone', e164 } : { kind: 'invalid', message: CONTACT_INVALID_PHONE };
}

/** An email goes as `email`, which older servers also accept; a phone number as `contact` in +234 form. */
export function contactRequestBody(raw: string): { email: string } | { contact: string } | null {
  const input = readContactInput(raw);
  if (input.kind === 'email') return { email: input.email };
  if (input.kind === 'phone') return { contact: input.e164 };
  return null;
}

export function personContactLabel(person: {
  email?: string | null;
  phoneMasked?: string | null;
}): string | undefined {
  return person.email || person.phoneMasked || undefined;
}

/** The server's answer when nobody has that phone number or email (old and new wording). */
export function isNoAccountMessage(message: string | null | undefined): boolean {
  return /^No Sureground account uses that/i.test(message?.trim() ?? '');
}

/** No tracking parameters and nothing about either person. `reason` finishes "Join me on Sureground so I can …". */
export function signupInviteMessage(
  signupUrl: string,
  reason = 'add you as my representative'
): string {
  return `Join me on Sureground so I can ${reason}. Sign up here: ${signupUrl}`;
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
