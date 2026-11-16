import { z } from 'zod';
import {
  AUTH_CONSTANTS,
  CONTACT_INVALID_PHONE,
  ERROR_MESSAGES,
  toE164Phone,
} from '@sureground/shared';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[+]?[0-9][0-9\s-]{6,16}$/;

export const identifierSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email or phone number')
  .refine((v) => EMAIL_RE.test(v) || PHONE_RE.test(v), 'Enter a valid email or phone number');

export const signInSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, 'Enter your password'),
});
export type SignInValues = z.infer<typeof signInSchema>;

const passwordRules = z
  .string()
  .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_SHORT)
  .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_LONG);

export const emailSignupSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().regex(EMAIL_RE, 'Enter a valid email address'),
  password: passwordRules,
  acceptedTerms: z.literal(true, {
    error: 'Accept the terms to continue',
  }),
});
export type EmailSignupValues = z.infer<typeof emailSignupSchema>;

export const phoneSignupSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  phone: z
    .string()
    .trim()
    .refine((v) => toE164Phone(v) !== null, CONTACT_INVALID_PHONE),
  password: passwordRules,
  acceptedTerms: z.literal(true, {
    error: 'Accept the terms to continue',
  }),
});
export type PhoneSignupValues = z.infer<typeof phoneSignupSchema>;

// One shape for both methods, so switching between email and phone keeps what was typed.
const stepOneShared = {
  fullName: z.string().trim().min(2, 'Enter your full name'),
  password: passwordRules,
  acceptedTerms: z.literal(true, { error: 'Accept the terms to continue' }),
};
export const emailStepOneSchema = z.object({
  ...stepOneShared,
  email: z.string().trim().regex(EMAIL_RE, 'Enter a valid email address'),
  phone: z.string(),
});

export const phoneStepOneSchema = z.object({
  ...stepOneShared,
  email: z.string(),
  phone: z
    .string()
    .trim()
    .refine((v) => toE164Phone(v) !== null, CONTACT_INVALID_PHONE),
});

export type StepOneFormValues = z.infer<typeof emailStepOneSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
