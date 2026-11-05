import {
  canReportNoShow,
  emailOk,
  inspectionTextOk,
  tourReasonOk,
} from '@/lib/api/landBuyerExtras';

describe('tours, inspections and representatives', () => {
  it('needs 3–500 characters to cancel a tour or ask for other times', () => {
    expect(tourReasonOk('  no ')).toBe(false);
    expect(tourReasonOk('Travelling')).toBe(true);
    expect(tourReasonOk('x'.repeat(501))).toBe(false);
  });

  it('lets the buyer report a no-show 15 minutes after a booked tour', () => {
    const at = '2026-11-05T10:00:00Z';
    expect(
      canReportNoShow({ status: 'SCHEDULED', scheduledAt: at }, Date.parse('2026-11-05T10:14:00Z'))
    ).toBe(false);
    expect(
      canReportNoShow({ status: 'SCHEDULED', scheduledAt: at }, Date.parse('2026-11-05T10:16:00Z'))
    ).toBe(true);
    expect(
      canReportNoShow({ status: 'COMPLETED', scheduledAt: at }, Date.parse('2026-11-05T11:00:00Z'))
    ).toBe(false);
  });

  it('needs 10–2000 characters for a question or reinspection', () => {
    expect(inspectionTextOk('Too short')).toBe(false);
    expect(inspectionTextOk('Which beacon is missing?')).toBe(true);
  });

  it('checks an email loosely, as web does', () => {
    expect(emailOk('ada@example.com')).toBe(true);
    expect(emailOk('ada@example')).toBe(false);
  });
});
