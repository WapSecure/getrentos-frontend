import {
  layoutInput,
  layoutProblem,
  layoutToForm,
  parseTags,
  planInput,
  planProblem,
  planToForm,
  plotProblem,
  priceExample,
  publishChecklist,
} from '@/lib/api/landLayout';

describe('layout form', () => {
  it('starts with the defaults web uses and checks the holds', () => {
    const f = { ...layoutToForm(null), name: 'Palm Grove' };
    expect(f.reservationHoldHours).toBe('48');
    expect(f.inspectionHoldDays).toBe('7');
    expect(layoutProblem(f)).toBeNull();
    expect(layoutProblem({ ...f, name: 'P' })).toMatch(/Name/);
    expect(layoutProblem({ ...f, reservationHoldHours: '400' })).toMatch(/336/);
    expect(layoutProblem({ ...f, inspectionHoldDays: '15' })).toMatch(/0 and 14/);
  });

  it('clears an emptied field on edit, and leaves it out on create', () => {
    const f = { ...layoutToForm(null), name: 'Palm Grove', documentationFee: '150000.4' };
    expect(layoutInput(f, true)).toMatchObject({ description: null, layoutPlanDocumentId: null });
    expect(layoutInput(f, false).description).toBeUndefined();
    expect(layoutInput(f, false).documentationFee).toBe(150000);
  });

  it('lists what publishing needs', () => {
    const items = publishChecklist({ parcelSaleReady: true, available: 0, activePlans: 2 });
    expect(items.map((i) => i.done)).toEqual([true, false, true]);
  });
});

describe('plots', () => {
  it('needs a number, size and price for a new plot, only a price when editing', () => {
    const ok = { plotNumber: 'A1', areaValue: '450', price: '4100000', tags: 'corner, gate' };
    expect(plotProblem(false, ok)).toBeNull();
    expect(plotProblem(false, { ...ok, plotNumber: '' })).toMatch(/plot number/);
    expect(plotProblem(false, { ...ok, areaValue: '0' })).toMatch(/size/);
    expect(plotProblem(true, { ...ok, plotNumber: '', areaValue: '' })).toBeNull();
    expect(plotProblem(true, { ...ok, price: '0' })).toMatch(/price/);
    expect(plotProblem(false, { ...ok, tags: 'x'.repeat(41) })).toMatch(/40 characters/);
  });

  it('splits tags on commas', () => {
    expect(parseTags(' road-facing, , near gate ')).toEqual(['road-facing', 'near gate']);
  });
});

describe('payment plans', () => {
  it('converts percentages to basis points', () => {
    const f = { ...planToForm(null), name: '12 months', deposit: '30', uplift: '5.5' };
    expect(planInput(f)).toMatchObject({
      initialDepositBps: 3000,
      priceUpliftBps: 550,
      revocationChargeBps: 2000,
    });
  });

  it('refuses terms the server would', () => {
    const f = { ...planToForm(null), name: 'Plan' };
    expect(planProblem(f)).toBeNull();
    expect(planProblem({ ...f, deposit: '100' })).toMatch(/below 100%/);
    expect(planProblem({ ...f, deposit: '100', durationMonths: '0' })).toBeNull();
    expect(planProblem({ ...f, gracePeriodDays: '60', defaultAfterDays: '30' })).toMatch(
      /later than the grace/
    );
    expect(planProblem({ ...f, lateFee: '2.555' })).toMatch(/2 decimal/);
    expect(planProblem({ ...f, durationMonths: '1.5' })).toMatch(/whole number/);
  });

  it('prices a plan as the server does', () => {
    // 12 months, 30% deposit, 10% premium on ₦10m with ₦900k fees.
    const ex = priceExample(10_000_000, 900_000, {
      durationMonths: 12,
      initialDepositBps: 3000,
      priceUpliftBps: 1000,
    });
    expect(ex.totalPrice).toBe(11_900_000);
    expect(ex.initialPayment).toBe(3_300_000 + 900_000);
    expect(ex.monthlyInstallment * 11 + ex.finalInstallment).toBe(11_900_000 - 4_200_000);
    expect(
      priceExample(10_000_000, 900_000, {
        durationMonths: 0,
        initialDepositBps: 10000,
        priceUpliftBps: 1000,
      })
    ).toMatchObject({
      priceUplift: 0,
      totalPrice: 10_900_000,
      initialPayment: 10_900_000,
    });
  });
});
