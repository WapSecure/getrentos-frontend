/**
 * Finding a person by "their phone number or email". Accounts can be phone-only, so a lookup that
 * asks only for an email strands many people. Mirrors the backend's `src/shared/phone/contact.ts`;
 * the server decides, this only checks input early and builds the request.
 */

export type ContactInput =
  | { kind: 'empty' }
  | { kind: 'email'; email: string }
  | { kind: 'phone'; e164: string }
  | { kind: 'invalid'; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NG_NATIONAL_RE = /^[789]\d{9}$/;

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

/** Anything with an @ is read as an email; anything else as a phone number. */
export function readContactInput(raw: string | null | undefined): ContactInput {
  const value = raw?.trim() ?? '';
  if (!value) return { kind: 'empty' };
  if (value.includes('@')) {
    return EMAIL_RE.test(value)
      ? { kind: 'email', email: value }
      : { kind: 'invalid', message: CONTACT_INVALID_EMAIL };
  }
  const e164 = toE164Phone(value);
  return e164 ? { kind: 'phone', e164 } : { kind: 'invalid', message: CONTACT_INVALID_PHONE };
}

/**
 * The request body for a lookup by phone or email. An email goes as `email`, which older servers
 * also accept; a phone number goes as `contact` in the normalised +234 form.
 */
export function contactRequestBody(raw: string): { email: string } | { contact: string } | null {
  const input = readContactInput(raw);
  if (input.kind === 'email') return { email: input.email };
  if (input.kind === 'phone') return { contact: input.e164 };
  return null;
}

/** How to show another person: their email, or their masked phone when they have no email. */
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

/**
 * A plain invitation to sign up. No tracking parameters and nothing about either person. `reason`
 * finishes "Join me on Sureground so I can …", for example "add you to my estate staff".
 */
export function signupInviteMessage(
  signupUrl: string,
  reason = 'add you as my representative'
): string {
  return `Join me on Sureground so I can ${reason}. Sign up here: ${signupUrl}`;
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
