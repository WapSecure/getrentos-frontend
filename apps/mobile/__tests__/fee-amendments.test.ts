import {
  effectiveDateOptions,
  feeHeadline,
  feeValueError,
  formatLagosDay,
  type MandateVersion,
} from '@/lib/api/feeAmendments';

const v = (version: number, label: string, effectiveFrom: string): MandateVersion => ({
  version,
  fee: { type: 'PERCENTAGE', value: Number(label.replace('%', '')), label },
  effectiveFrom,
  amendmentId: null,
  createdAt: '2026-01-01T00:00:00Z',
});

describe('feeHeadline', () => {
  it('names both fees while an agreed change is ahead', () => {
    expect(
      feeHeadline(
        { currentFee: null, versions: [v(1, '8%', '2026-01-01'), v(2, '10%', '2026-12-01')] },
        '2026-11-11'
      )
    ).toBe('Fee: 8% until 30 November 2026, then 10% from 1 December 2026');
  });

  it('gives the fee in force once the change has started', () => {
    expect(
      feeHeadline(
        { currentFee: null, versions: [v(1, '8%', '2026-01-01'), v(2, '10%', '2026-11-01')] },
        '2026-11-11'
      )
    ).toBe('Agreed fee: 10%');
  });

  it('falls back to the current fee, or says there is none', () => {
    expect(
      feeHeadline({ currentFee: { type: 'FLAT', value: 50000, label: '₦50,000' }, versions: [] })
    ).toBe('Agreed fee: ₦50,000');
    expect(feeHeadline({ currentFee: null, versions: [] })).toMatch(/No fee/);
  });
});

describe('effectiveDateOptions', () => {
  it('offers the first of twelve months, across the year end', () => {
    const options = effectiveDateOptions('2026-12-01');
    expect(options).toHaveLength(12);
    expect(options[0]).toEqual({ value: '2026-12-01', label: '1 December 2026' });
    expect(options[1].value).toBe('2027-01-01');
  });
});

describe('feeValueError', () => {
  it('caps a percentage and wants whole naira for a flat fee', () => {
    expect(feeValueError('', 'PERCENTAGE', 20)).toBeNull();
    expect(feeValueError('25', 'PERCENTAGE', 20)).toMatch(/20%/);
    expect(feeValueError('7.5', 'PERCENTAGE', 20)).toBeNull();
    expect(feeValueError('100.5', 'FLAT', 20)).toMatch(/whole/);
  });
});

it('formats a Lagos day', () => {
  expect(formatLagosDay('2026-12-01')).toBe('1 December 2026');
  expect(formatLagosDay(null)).toBe('');
});
