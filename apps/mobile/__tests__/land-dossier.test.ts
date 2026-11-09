import { costFigure, estimatedTotal, words } from '@/lib/api/landDossier';
import { checkedByText, percentileWords } from '@sureground/shared';

describe('land decision dossier', () => {
  it('shows a confirmed cost exactly, an estimate as a range, and unknown as a dash', () => {
    const base = { key: 'k', label: 'x', recurring: false };
    expect(costFigure({ ...base, status: 'CONFIRMED', amount: 15000000 })).toBe('₦15,000,000');
    expect(costFigure({ ...base, status: 'ESTIMATED', low: 750000, high: 1500000 })).toBe(
      '₦750,000 – ₦1,500,000'
    );
    expect(costFigure({ ...base, status: 'ESTIMATED', low: 5000, high: 5000 })).toBe('≈ ₦5,000');
    expect(costFigure({ ...base, status: 'NOT_YET_KNOWN' })).toBe('—');
  });

  it('collapses an exact all-in total to one figure', () => {
    const cost = {
      items: [],
      confirmedTotal: 1,
      unknownCount: 0,
      estimatesDraft: false,
    };
    expect(estimatedTotal({ ...cost, estimatedLow: 10, estimatedHigh: 10 })).toBe('₦10');
    expect(estimatedTotal({ ...cost, estimatedLow: 10, estimatedHigh: 20 })).toBe('₦10 – ₦20');
  });

  it('reads codes as words', () => {
    expect(words('CERTIFICATE_OF_OCCUPANCY')).toBe('Certificate of occupancy');
  });

  it('shares the trust and price wording with web', () => {
    expect(checkedByText(['SUREGROUND', 'SURVEYOR'])).toBe(
      'Sureground and an independent surveyor'
    );
    expect(percentileWords(0)).toBe('cheaper per m² than most comparable land');
    expect(percentileWords(50)).toBe('around the middle of comparable land per m²');
    expect(percentileWords(95)).toBe('dearer per m² than most comparable land');
  });
});
