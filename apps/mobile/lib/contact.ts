import { contactRequestBody, readContactInput } from '@sureground/shared';

/**
 * The body for "find this person by phone number or email". An email goes as `email`, which older
 * servers also accept; a phone number goes as `contact` in the +234 form.
 */
export const contactBody = (raw: string): { email: string } | { contact: string } =>
  contactRequestBody(raw) ?? { contact: raw.trim() };

/** True once the value reads as an email or a phone number. */
export const contactReady = (raw: string): boolean => {
  const kind = readContactInput(raw).kind;
  return kind === 'email' || kind === 'phone';
};

/** What is wrong with the value, once there is something to check. */
export const contactProblem = (raw: string): string | undefined => {
  const input = readContactInput(raw);
  return input.kind === 'invalid' ? input.message : undefined;
};

export const CONTACT_HINT = 'The one on their Sureground account, for example 0803 123 4567';
