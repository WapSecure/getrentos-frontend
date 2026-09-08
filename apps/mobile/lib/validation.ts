import { z } from 'zod';

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
  .min(8, 'Use at least 8 characters')
  .max(50, 'That password is too long');

export const emailSignupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name'),
    email: z.string().trim().regex(EMAIL_RE, 'Enter a valid email address'),
    password: passwordRules,
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'Accept the terms to continue' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type EmailSignupValues = z.infer<typeof emailSignupSchema>;

export const phoneSignupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name'),
    phone: z.string().trim().regex(PHONE_RE, 'Enter a valid phone number'),
    password: passwordRules,
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'Accept the terms to continue' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type PhoneSignupValues = z.infer<typeof phoneSignupSchema>;

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
