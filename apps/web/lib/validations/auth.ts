import { z } from 'zod';
import { CONTACT_INVALID_EMAIL, CONTACT_INVALID_PHONE, toE164Phone } from '@sureground/shared';
import { AUTH_CONSTANTS, ERROR_MESSAGES } from '../constants/auth';

export const SIGNUP_PASSWORD_HINT = 'At least 12 characters. A short phrase works well.';

export const signupDetailsSchema = (channel: 'email' | 'phone') =>
  z.object({
    fullName: z.string().trim().min(1, 'Enter your full name.'),
    // Both are kept so switching between email and phone loses nothing; only the shown one is checked.
    email: channel === 'email' ? z.string().trim().email(CONTACT_INVALID_EMAIL) : z.string(),
    phone:
      channel === 'phone'
        ? z.string().refine((value) => toE164Phone(value) !== null, CONTACT_INVALID_PHONE)
        : z.string(),
    password: z
      .string()
      .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_SHORT)
      .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_LONG),
    referralCode: z.string().trim().max(32, 'Referral codes are shorter than this.'),
    terms: z.boolean().refine(Boolean, 'Agree to the Terms and Privacy Policy to continue.'),
  });

export type SignupDetailsData = z.infer<ReturnType<typeof signupDetailsSchema>>;
