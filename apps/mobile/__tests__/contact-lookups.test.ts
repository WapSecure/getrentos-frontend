import { apiFetch } from '@/lib/api/client';
import { contactBody, contactProblem, contactReady } from '@/lib/contact';
import { estateStaffSetupApi } from '@/lib/api/estateStaffSetup';

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(),
  ApiError: class ApiError extends Error {},
}));

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const lastBody = () => (fetchMock.mock.calls.at(-1)?.[1] as { body?: unknown } | undefined)?.body;

describe('contact lookups', () => {
  beforeEach(() => fetchMock.mockReset().mockResolvedValue({} as never));

  it('sends an email as email, so older servers still understand it', () => {
    expect(contactBody(' Ada@Example.com ')).toEqual({ email: 'Ada@Example.com' });
  });

  it('sends a phone number as contact in the +234 form', () => {
    for (const typed of ['0803 123 4567', '+234 803 123 4567', '2348031234567', '803-123-4567']) {
      expect(contactBody(typed)).toEqual({ contact: '+2348031234567' });
    }
  });

  it('is ready only for an email or a whole phone number', () => {
    expect(contactReady('08031234567')).toBe(true);
    expect(contactReady('ada@example.com')).toBe(true);
    expect(contactReady('4567')).toBe(false);
    expect(contactReady('')).toBe(false);
    expect(contactProblem('4567')).toMatch(/valid phone number/);
    expect(contactProblem('')).toBeUndefined();
  });

  it('adds a gateman by phone number', async () => {
    await estateStaffSetupApi.addGateman('estate-1', '0803 123 4567');
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/estate/estate-1/staff/gateman');
    expect(lastBody()).toEqual({ contact: '+2348031234567' });
  });
});
