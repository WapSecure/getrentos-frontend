import { applyLastApplication, type PrefillableApplicationFields } from '@sureground/shared';

const empty: PrefillableApplicationFields = {
  phone: '',
  currentAddress: '',
  monthlyIncome: '',
  employmentStatus: 'Employed',
  employer: '',
  nextOfKinName: '',
  nextOfKinPhone: '',
  nextOfKinRelationship: '',
  referenceName: '',
  referencePhone: '',
  referenceRelationship: '',
};

describe('applyLastApplication', () => {
  const last = {
    phone: '+2348012345678',
    currentAddress: '5 Allen Avenue, Ikeja',
    monthlyIncome: 850000,
    employmentStatus: 'Self-employed',
    employer: 'Ade Logistics',
    reference: { name: 'Mr Ade', phone: '+2348000000000', relationship: 'Former landlord' },
  };

  it('fills empty fields from the last application', () => {
    const out = applyLastApplication(empty, last);
    expect(out).toMatchObject({
      phone: '+2348012345678',
      currentAddress: '5 Allen Avenue, Ikeja',
      monthlyIncome: '850000',
      employmentStatus: 'Self-employed',
      employer: 'Ade Logistics',
      referenceName: 'Mr Ade',
      nextOfKinName: '',
    });
  });

  it('never overwrites what the renter already typed', () => {
    const out = applyLastApplication({ ...empty, phone: '08099999999' }, last);
    expect(out.phone).toBe('08099999999');
  });

  it('keeps the form’s status when the last one is not an option it offers', () => {
    const out = applyLastApplication(empty, {
      ...last,
      employmentStatus: 'Employed — Zenith Bank',
    });
    expect(out.employmentStatus).toBe('Employed');
  });

  it('leaves the form alone when there is no last application', () => {
    expect(applyLastApplication(empty, null)).toBe(empty);
  });
});
