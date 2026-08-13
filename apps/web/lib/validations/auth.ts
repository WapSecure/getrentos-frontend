import { z } from 'zod';
import { AUTH_CONSTANTS, ERROR_MESSAGES, VALIDATION_PATTERNS } from '../constants/auth';

export const emailSchema = z
  .object({
    email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
    fullName: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
    password: z
      .string()
      .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_SHORT)
      .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: ERROR_MESSAGES.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  });

export const phoneSchema = z
  .object({
    phone: z
      .string()
      .min(10, ERROR_MESSAGES.INVALID_PHONE)
      .regex(
        VALIDATION_PATTERNS.PHONE,
        ERROR_MESSAGES.INVALID_PHONE
      ),
    fullName: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
    password: z
      .string()
      .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_SHORT)
      .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: ERROR_MESSAGES.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  });

export const otpSchema = z.object({
  otp: z.string().length(AUTH_CONSTANTS.OTP_LENGTH, ERROR_MESSAGES.INVALID_OTP),
});

export type EmailFormData = z.infer<typeof emailSchema>;
export type PhoneFormData = z.infer<typeof phoneSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
