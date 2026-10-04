import { apiFetchOrNull } from '@/lib/api/client';

describe('apiFetchOrNull', () => {
  const respond = (body: string) =>
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 200, text: async () => body } as Response);

  afterEach(() => jest.restoreAllMocks());

  it('turns the API’s empty "there isn’t one" into null, which a query can hold', async () => {
    respond('');
    await expect(apiFetchOrNull('/estate/e1/emergency-musters/active')).resolves.toBeNull();
  });

  it('returns the thing when there is one', async () => {
    respond(JSON.stringify({ id: 'm1' }));
    await expect(apiFetchOrNull('/estate/e1/emergency-musters/active')).resolves.toEqual({
      id: 'm1',
    });
  });
});
