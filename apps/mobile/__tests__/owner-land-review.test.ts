import {
  checkProgress,
  documentTypeLabel,
  lagosToIso,
  proposeBlocker,
  readyToList,
  type OwnerLandRecord,
} from '@/lib/api/ownerLand';

const record = (over: Partial<OwnerLandRecord> = {}): OwnerLandRecord => ({
  propertyId: 'p1',
  title: 'Plot',
  address: '1 Road',
  city: 'Lekki',
  state: 'Lagos',
  isPropertyVerified: true,
  ownershipProofCount: 1,
  hasActiveSaleListing: false,
  ...over,
});

describe('diligence review', () => {
  it('counts required checks done, with not-applicable as done', () => {
    expect(
      checkProgress([
        { key: 'a', label: 'A', required: true, status: 'PASSED' },
        { key: 'b', label: 'B', required: true, status: 'NOT_APPLICABLE' },
        { key: 'c', label: 'C', required: true, status: 'PENDING' },
        { key: 'd', label: 'D', required: false, status: 'PASSED' },
      ])
    ).toEqual({ done: 2, required: 3 });
    expect(checkProgress()).toEqual({ done: 0, required: 0 });
  });

  it('is ready to list only when diligence is verified and the property approved', () => {
    const verified = {
      areaValue: 600,
      areaUnit: 'SQUARE_METERS' as const,
      diligence: { status: 'VERIFIED' as const },
    };
    expect(readyToList(record({ parcel: verified, propertyVerificationStatus: 'APPROVED' }))).toBe(
      true
    );
    expect(readyToList(record({ parcel: verified, propertyVerificationStatus: 'PENDING' }))).toBe(
      false
    );
    expect(readyToList(record({ propertyVerificationStatus: 'APPROVED' }))).toBe(false);
  });

  it('labels document types, including ones the list does not name', () => {
    expect(documentTypeLabel('SURVEY_PLAN')).toBe('Survey plan');
    expect(documentTypeLabel('LEGAL_INQUIRY_REPORT')).toBe('Legal inquiry report');
  });
});

describe('tour times', () => {
  it('reads a Lagos date and time as an instant (UTC+1)', () => {
    expect(lagosToIso('2026-11-10', '09:30')).toBe('2026-11-10T08:30:00.000Z');
    expect(lagosToIso('2026-11-10', '')).toBeNull();
    expect(lagosToIso('', '09:30')).toBeNull();
  });

  it('needs a future time and an https link', () => {
    const now = Date.parse('2026-11-04T12:00:00Z');
    const future = '2026-11-10T08:30:00.000Z';
    expect(proposeBlocker([future, null, null], 'https://meet.example/x', now)).toBeNull();
    expect(proposeBlocker([null, null, null], 'https://meet.example/x', now)).toMatch(
      /at least one/
    );
    expect(proposeBlocker(['2026-11-01T08:30:00.000Z'], 'https://m', now)).toMatch(/future/);
    expect(proposeBlocker([future], 'http://insecure', now)).toMatch(/https/);
  });
});
