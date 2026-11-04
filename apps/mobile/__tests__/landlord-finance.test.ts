import {
  exportPath,
  monthsAgo,
  optionalAmount,
  payableNow,
  percent,
  sortPerformance,
  utilisationTone,
  type PropertyPerformance,
} from '@/lib/api/landlordFinance';

describe('budgets', () => {
  it('reads green under 80%, amber to 100%, red over', () => {
    expect(utilisationTone(79)).toBe('success');
    expect(utilisationTone(80)).toBe('warning');
    expect(utilisationTone(100)).toBe('warning');
    expect(utilisationTone(101)).toBe('danger');
  });
});

describe('automatic payouts', () => {
  it('pays out the balance less the reserve, never below zero', () => {
    expect(payableNow(1_200_000, 200_000)).toBe(1_000_000);
    expect(payableNow(100_000, 200_000)).toBe(0);
  });
});

describe('reports', () => {
  it('adds the window only to the income and expenses export', () => {
    const range = { from: '2025-11-04', to: '2026-11-04' };
    expect(exportPath('pnl', range)).toBe(
      '/landlord/reports/pnl/export?from=2025-11-04&to=2026-11-04'
    );
    expect(exportPath('arrears', range)).toBe('/landlord/reports/arrears/export');
  });

  it('counts months back from a date', () => {
    expect(monthsAgo(12, new Date('2026-11-04T12:00:00Z'))).toBe('2025-11-04');
  });
});

describe('portfolio', () => {
  const row = (id: string, capRate: number | null): PropertyPerformance => ({
    propertyId: id,
    name: id,
    city: '',
    totalUnits: 1,
    occupiedUnits: 1,
    occupancyRate: 100,
    annualRentRoll: 0,
    rentCollected: 0,
    operatingExpenses: 0,
    netOperatingIncome: 0,
    expenseRatio: null,
    capRate,
    grossYield: null,
    yieldOnCost: null,
    appreciation: null,
    capRateVsPortfolio: null,
    missing: [],
  });

  it('sorts highest first and sinks properties without the figure', () => {
    const sorted = sortPerformance([row('a', null), row('b', 4), row('c', 9)], 'capRate');
    expect(sorted.map((r) => r.propertyId)).toEqual(['c', 'b', 'a']);
  });

  it('formats percentages and a missing one', () => {
    expect(percent(12.345)).toBe('12.3%');
    expect(percent(null)).toBe('—');
  });

  it('takes a blank amount as unset and refuses a non-positive one', () => {
    expect(optionalAmount(' ')).toBeUndefined();
    expect(optionalAmount('45000000.4')).toBe(45_000_000);
    expect(optionalAmount('0')).toBeNull();
    expect(optionalAmount('abc')).toBeNull();
  });
});
