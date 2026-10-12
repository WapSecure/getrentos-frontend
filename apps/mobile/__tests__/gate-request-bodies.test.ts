import { gatemanApi } from '@/lib/api/gateman';

/**
 * The gate's courier-code check and patrol scan once passed a string that
 * apiFetch encoded again, so the API received a quoted string instead of
 * `{ code }` and refused it with a 400. These check what actually goes out.
 */
describe('gate requests send an object body', () => {
  let fetchSpy: jest.SpyInstance;
  beforeEach(() => {
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 200, text: async () => '{}' } as Response);
  });
  afterEach(() => jest.restoreAllMocks());

  const sentBody = () => {
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    return JSON.parse(String(init.body));
  };

  it('checks a courier code', async () => {
    await gatemanApi.verifyDeliveryCode('estate-1', '123456');
    expect(sentBody()).toEqual({ code: '123456' });
  });

  it('scans a patrol checkpoint, with when it happened', async () => {
    await gatemanApi.scanPatrolCheckpoint('estate-1', 'CP-7', {
      occurredAt: '2026-10-11T22:10:00Z',
    });
    expect(sentBody()).toEqual({ code: 'CP-7', occurredAt: '2026-10-11T22:10:00Z' });
  });
});
