import {
  EMPTY_COMMERCIAL,
  commercialError,
  commercialFromDetails,
  commercialSections,
  commercialToCreatePayload,
  commercialToUpdatePayload,
  fromRental,
  isCommercialPropertyType,
  vatRow,
  vatStated,
} from '@sureground/shared/showroom';

describe('commercial form on mobile', () => {
  it('only offers the block on commercial properties', () => {
    expect(isCommercialPropertyType('COMMERCIAL')).toBe(true);
    expect(isCommercialPropertyType('commercial')).toBe(true);
    expect(isCommercialPropertyType('DUPLEX')).toBe(false);
    expect(isCommercialPropertyType(undefined)).toBe(false);
  });

  it('sends only what the lister stated when creating', () => {
    expect(commercialToCreatePayload(EMPTY_COMMERCIAL)).toBeUndefined();
    expect(
      commercialToCreatePayload({
        ...EMPTY_COMMERCIAL,
        permittedUse: 'OFFICE',
        vatStatedPct: '7.5',
        generator: 'no',
        generatorNote: 'ignored when there is no generator',
      })
    ).toEqual({ permittedUse: 'OFFICE', vatStatedPct: 7.5, generator: false });
  });

  it('clears a field on edit by sending null', () => {
    const payload = commercialToUpdatePayload(
      commercialFromDetails({ permittedUse: 'SHOP', parkingSpaces: 4 })
    );
    expect(payload.permittedUse).toBe('SHOP');
    expect(payload.parkingSpaces).toBe(4);
    expect(payload.vatStatedPct).toBeNull();
    expect(payload.leaseTermOptionsYears).toEqual([]);
  });

  it('refuses values the API would refuse, in the same words', () => {
    expect(commercialError({ ...EMPTY_COMMERCIAL, publicSupplyHoursStated: '25' })).toBe(
      'Public supply hours must be between 0 and 24 a day.'
    );
    expect(commercialError({ ...EMPTY_COMMERCIAL, vatStatedPct: '7.555' })).toBe(
      'VAT can have at most two decimal places.'
    );
    expect(commercialError({ ...EMPTY_COMMERCIAL, vatStatedPct: '7.' })).toBeNull();
  });
});

describe('commercial block on the listing screens', () => {
  it('shows VAT only as stated and never works out an amount', () => {
    expect(vatRow({ vatStatedPct: 7.5, vatIncluded: false }, 'rent')).toEqual({
      key: 'vat',
      label: 'VAT',
      value: '7.5% (stated by the landlord)',
      hint: 'Rent does not include VAT (stated)',
    });
    expect(vatRow({}, 'sale')).toBeNull();
    expect(vatStated({ parkingSpaces: 2 })).toBe(false);
    expect(vatStated({ vatIncluded: true })).toBe(true);
  });

  it('orders the lease first, then the space, then running the business', () => {
    const s = commercialSections(
      { leaseTermOptionsYears: [2, 5], lettableAreaSqm: 120, publicSupplyHoursStated: 8 },
      'rent'
    );
    expect(s.lease.map((r) => r.value)).toEqual(['2 or 5 years']);
    expect(s.space.map((r) => r.label)).toEqual(['Lettable area']);
    expect(s.running.map((r) => r.value)).toEqual(['About 8 hours a day (stated)']);
  });

  it('reads the block only on a commercial listing', () => {
    const base = { id: 'l1', title: 'Shop', location: 'Ikeja', price: 1, period: 'year' as const };
    const commercial = { permittedUse: 'SHOP', vatStatedPct: 7.5 };
    expect(fromRental({ ...base, propertyType: 'COMMERCIAL', commercial }).commercial).toEqual(
      commercial
    );
    expect(fromRental({ ...base, propertyType: 'DUPLEX', commercial }).commercial).toBeUndefined();
  });
});
