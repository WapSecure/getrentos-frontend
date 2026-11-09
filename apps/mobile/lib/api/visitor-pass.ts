/** Defined once, so a new status breaks every consumer at compile time. */

/** `approved`: the household consented and the guard has not admitted them yet. Consent and entry are kept apart on purpose. */
export type VisitorPassStatus =
  | 'pending'
  | 'awaiting_approval'
  | 'approved'
  | 'checked_in'
  | 'checked_out'
  | 'expired'
  | 'revoked'
  | 'denied';

/** `contractor`: the estate office authorised repeat arrivals; each is still recorded against the household they work for. */
export type VisitorPassSource = 'resident' | 'gate' | 'contractor';

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
  checkedOutAt?: string;
  respondedAt?: string;
  denialReason?: string;
  /** Set only on a write that screened somebody at a gate and the list matched without refusing them; absent on a pass read from records. */
  watchlistWarning?: string;
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

export function isReadyToAdmit(pass: Pick<VisitorPass, 'status'>): boolean {
  return pass.status === 'approved';
}
