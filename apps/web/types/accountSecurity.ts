import type { StepUpMethod } from '@sureground/shared';

/** The person's own sign-in security (backend /users/me/security), for every role. */
export interface SecurityOverview {
  /** False for accounts that only ever signed in with Google or Apple. */
  hasPassword: boolean;
  hasTransactionPin: boolean;
  hasPasskey: boolean;
  stepUpMethod: StepUpMethod;
}

export interface TwoFactorStatus {
  enrolled: boolean;
  enabled: boolean;
  /** Unused one-time backup codes (0 while two-factor is off). */
  recoveryCodesLeft?: number;
}

export interface TwoFactorEnrollment {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

export interface Passkey {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

/** One device the person is signed in on ("Where you're signed in"). */
export interface AccountSession {
  id: string;
  /** Readable device, e.g. "Chrome on macOS". */
  device: string;
  ipAddress?: string;
  lastActiveAt: string;
  /** The device making this request. */
  current: boolean;
}

export interface SetTransactionPinInput {
  currentPassword?: string;
  pin: string;
  currentPin?: string;
  reference?: string;
  code?: string;
}
