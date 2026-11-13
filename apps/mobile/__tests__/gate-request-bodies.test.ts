import { gatemanApi } from '@/lib/api/gateman';
import { estateManagerApi } from '@/lib/api/estateManager';

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

  it('records who collected a parcel, trimmed', async () => {
    await gatemanApi.markDeliveryCollected('estate-1', 'log-1', '  Ada Okoro ');
    expect(String(fetchSpy.mock.calls[0][0])).toContain(
      '/estate/estate-1/deliveries/log-1/collect'
    );
    expect(sentBody()).toEqual({ collectedBy: 'Ada Okoro' });
  });

  it('collects a parcel with no name when none is given', async () => {
    await gatemanApi.markDeliveryCollected('estate-1', 'log-1', '   ');
    expect(sentBody()).toEqual({});
  });

  it('moves an incident to in progress', async () => {
    await estateManagerApi.startIncident('estate-1', 'incident-1');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain('/estate/estate-1/incidents/incident-1/start');
    expect(init.method).toBe('PATCH');
  });

  it('scans a patrol checkpoint, with when it happened', async () => {
    await gatemanApi.scanPatrolCheckpoint('estate-1', 'CP-7', {
      occurredAt: '2026-10-11T22:10:00Z',
    });
    expect(sentBody()).toEqual({ code: 'CP-7', occurredAt: '2026-10-11T22:10:00Z' });
  });
});
