import { contactRequestBody, readContactInput } from '@sureground/shared';

/** An email goes as `email`, which older servers also accept; a phone number goes as `contact` in +234 form. */
export const contactBody = (raw: string): { email: string } | { contact: string } =>
  contactRequestBody(raw) ?? { contact: raw.trim() };

export const contactReady = (raw: string): boolean => {
  const kind = readContactInput(raw).kind;
  return kind === 'email' || kind === 'phone';
};

export const contactProblem = (raw: string): string | undefined => {
  const input = readContactInput(raw);
  return input.kind === 'invalid' ? input.message : undefined;
};

export const CONTACT_HINT = 'The one on their Sureground account, for example 0803 123 4567';
