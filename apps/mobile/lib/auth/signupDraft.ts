import type { OtpMethod } from '../api/auth';
import { secureStorage } from '../storage';

const KEY = 'sureground.signupDraft';
export const SIGNUP_DRAFT_TTL_MS = 10 * 60 * 1000;

/** Never holds the password: the roles step asks for it again after a restart. */
export interface StoredSignupDraft {
  method: 'email' | 'phone';
  otpMethod: OtpMethod;
  fullName: string;
  identifier: string;
  otpReference: string;
  sentAt: number;
  verified?: boolean;
  referralCode?: string;
}

export function parseSignupDraft(raw: string | null, now: number): StoredSignupDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<StoredSignupDraft>;
    if (
      (d.method !== 'email' && d.method !== 'phone') ||
      (d.otpMethod !== 'email' && d.otpMethod !== 'phone' && d.otpMethod !== 'whatsapp') ||
      typeof d.fullName !== 'string' ||
      typeof d.identifier !== 'string' ||
      typeof d.otpReference !== 'string' ||
      typeof d.sentAt !== 'number' ||
      now - d.sentAt > SIGNUP_DRAFT_TTL_MS
    ) {
      return null;
    }
    return {
      method: d.method,
      otpMethod: d.otpMethod,
      fullName: d.fullName,
      identifier: d.identifier,
      otpReference: d.otpReference,
      sentAt: d.sentAt,
      verified: d.verified === true,
      referralCode: typeof d.referralCode === 'string' ? d.referralCode : undefined,
    };
  } catch {
    return null;
  }
}

export async function loadSignupDraft(): Promise<StoredSignupDraft | null> {
  const raw = await secureStorage.get(KEY).catch(() => null);
  const draft = parseSignupDraft(raw, Date.now());
  if (raw && !draft) await clearSignupDraft();
  return draft;
}

export async function saveSignupDraft(draft: StoredSignupDraft): Promise<void> {
  await secureStorage.set(KEY, JSON.stringify(draft)).catch(() => undefined);
}

export async function clearSignupDraft(): Promise<void> {
  await secureStorage.remove(KEY).catch(() => undefined);
}
