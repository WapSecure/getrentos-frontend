import {
  deletePhraseOk,
  depositBack,
  reportReady,
  sortDeposits,
  type DepositHold,
  type TenantDeposit,
} from '@/lib/api/renterHome';
import { depositHolderText, noDeductionsText } from '@sureground/shared';

const hold = (over: Partial<DepositHold>): DepositHold => ({
  id: 'h',
  amount: 250000,
  status: 'HELD',
  heldBySureground: false,
  heldBy: null,
  takenAt: '2026-10-31',
  returnedAt: null,
  returnedAmount: null,
  summary: { held: 250000, approvedDeductions: 50000, proposedDeductions: 0, returnable: 200000 },
  deductions: [],
  ...over,
});

describe('renter home helpers', () => {
  it('shows what is due back while held, and what was paid once returned', () => {
    expect(depositBack(hold({}))).toBe(200000);
    expect(depositBack(hold({ status: 'RETURNED', returnedAmount: 180000 }))).toBe(180000);
    expect(depositBack(hold({ status: 'RETURNED', returnedAmount: null }))).toBe(0);
  });

  it('puts deposits that are actually held first', () => {
    const base = {
      leaseStatus: 'ACTIVE',
      propertyTitle: 'p',
      unitName: 'u',
      agreedAmount: 1,
      paidThroughSureground: null,
    };
    const list: TenantDeposit[] = [
      { ...base, leaseId: 'a', hold: null },
      { ...base, leaseId: 'b', hold: hold({}) },
    ];
    expect(sortDeposits(list).map((d) => d.leaseId)).toEqual(['b', 'a']);
  });

  it('needs who they claimed to be and a real description to report', () => {
    expect(reportReady('M', 'called me asking for rent')).toBe(false);
    expect(reportReady('New manager', 'short')).toBe(false);
    expect(reportReady('New manager', 'called me asking for rent')).toBe(true);
  });

  it('accepts the delete phrase regardless of case and spacing', () => {
    expect(deletePhraseOk(' Delete My Account ')).toBe(true);
    expect(deletePhraseOk('delete account')).toBe(false);
  });

  it('names who holds the deposit without a capitalised "Your"', () => {
    expect(depositHolderText({ heldBySureground: false, heldBy: 'Your landlord' })).toMatch(
      /^Held by your landlord\./
    );
    expect(depositHolderText({ heldBySureground: false, heldBy: 'Ada Homes Ltd' })).toMatch(
      /^Held by Ada Homes Ltd\./
    );
    expect(depositHolderText({ heldBySureground: true })).toMatch(/^Held by Sureground/);
  });

  it('speaks of a returned deposit in the past tense', () => {
    expect(noDeductionsText(true)).toBe('None. Your full deposit was returned.');
    expect(noDeductionsText(false)).toBe('None. Your full deposit is due back to you.');
  });
});
