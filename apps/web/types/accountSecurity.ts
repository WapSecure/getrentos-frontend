import type { StepUpMethod } from '@sureground/shared';

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
  /** 0 while two-factor is off. */
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

export interface AccountSession {
  id: string;
  device: string;
  ipAddress?: string;
  lastActiveAt: string;
  current: boolean;
}

export interface SetTransactionPinInput {
  currentPassword?: string;
  pin: string;
  currentPin?: string;
  reference?: string;
  code?: string;
}

export interface RecentSignIn {
  id: string;
  at: string;
  device: string;
  newDevice: boolean;
}

export interface PayoutHold {
  id: string;
  createdAt: string;
  signals: { rule: string; outcome: string; reason: string }[];
  appealNote: string | null;
  appealedAt: string | null;
}
