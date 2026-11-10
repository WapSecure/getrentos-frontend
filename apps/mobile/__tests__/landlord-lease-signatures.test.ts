import { leaseSignatures, OPEN_MAINTENANCE_STATUSES } from '../lib/api/landlord';

describe('leaseSignatures', () => {
  it('treats a signed lease as signed by both, even with no e-signature records', () => {
    expect(
      leaseSignatures({ status: 'signed', tenantSigned: false, landlordSigned: false })
    ).toEqual({ tenant: true, landlord: true });
    expect(
      leaseSignatures({ status: 'active', tenantSigned: false, landlordSigned: false })
    ).toEqual({ tenant: true, landlord: true });
  });

  it('knows the tenant has signed once the lease waits on payment or the landlord', () => {
    expect(
      leaseSignatures({ status: 'awaiting_landlord', tenantSigned: false, landlordSigned: false })
    ).toEqual({ tenant: true, landlord: false });
  });

  it('uses the e-signature records while the lease is still out for signing', () => {
    expect(leaseSignatures({ status: 'sent', tenantSigned: false, landlordSigned: false })).toEqual(
      { tenant: false, landlord: false }
    );
    expect(leaseSignatures({ status: 'sent', tenantSigned: true, landlordSigned: false })).toEqual({
      tenant: true,
      landlord: false,
    });
  });
});

describe('OPEN_MAINTENANCE_STATUSES', () => {
  it('counts a newly submitted request as open', () => {
    expect(OPEN_MAINTENANCE_STATUSES).toContain('submitted');
    expect(OPEN_MAINTENANCE_STATUSES).not.toContain('resolved');
  });
});
