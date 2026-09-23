/**
 * The visitor pass, defined once for the whole mobile app.
 *
 * Both API modules used to declare their own copy of this union and interface.
 * They had already drifted — the gate's copy carried `checkedOutAt` and the
 * resident's did not — which is the same shape of divergence that makes an
 * exhaustive `Record<VisitorPassStatus, …>` silently wrong when a status is
 * added. One definition means a new status breaks every consumer at compile
 * time instead of in whichever copy nobody updated.
 */

/**
 * `awaiting_approval` is a walk-in the gate raised and the household has not
 * answered; `approved` means they consented and the guard has not admitted them
 * yet. Consent and entry are kept apart on purpose, so the estate can show both
 * times and no arrival is recorded for a visitor who walked away.
 */
export type VisitorPassStatus =
  | 'pending'
  | 'awaiting_approval'
  | 'approved'
  | 'checked_in'
  | 'checked_out'
  | 'expired'
  | 'revoked'
  | 'denied';

/** `gate` when a guard raised it because somebody arrived with nothing. */
export type VisitorPassSource = 'resident' | 'gate';

export interface VisitorPass {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  status: VisitorPassStatus;
  source: VisitorPassSource;
  expiresAt: string;
  checkedInAt?: string;
  /** Set once the gate logs the visitor off the estate. */
  checkedOutAt?: string;
  /** When the household answered a walk-in request. */
  respondedAt?: string;
  /** Why they refused, so the guard can tell the visitor something. */
  denialReason?: string;
  createdAt: string;
}

export interface IssuedVisitorPass extends VisitorPass {
  pin: string;
  /** The pin encoded as a scannable QR code (data:image/png;base64,...). */
  qrDataUrl: string;
}

/** A walk-in is only live while the household can still answer it. */
export function isAwaitingApproval(pass: Pick<VisitorPass, 'status'>): boolean {
  return pass.status === 'awaiting_approval';
}

/** Approved by the household, not yet admitted by the gate. */
export function isReadyToAdmit(pass: Pick<VisitorPass, 'status'>): boolean {
  return pass.status === 'approved';
}
