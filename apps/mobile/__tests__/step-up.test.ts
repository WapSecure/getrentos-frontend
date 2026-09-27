import { apiFetch, ApiError } from '@/lib/api/client';
import {
  clearStepUpToken,
  registerStepUpPrompt,
  rememberStepUpToken,
  currentStepUpToken,
} from '@/lib/stepUp';

jest.mock('@/lib/env', () => ({ env: { apiUrl: 'https://api.test', clientApp: 'mobile' } }));

const reply = (status: number, body: unknown) =>
  ({
    ok: status < 400,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response;

describe('step-up', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as never;
    clearStepUpToken();
    registerStepUpPrompt(null);
  });

  it('asks once, then replays the refused request with the token', async () => {
    fetchMock
      .mockResolvedValueOnce(reply(403, { message: 'Confirm it’s you', error: 'STEP_UP_REQUIRED' }))
      .mockResolvedValueOnce(reply(200, { ok: true }));
    const prompt = jest.fn().mockResolvedValue('tok-1');
    registerStepUpPrompt(prompt);

    await expect(
      apiFetch('/marketplace/seller/payout-account', { method: 'POST', body: {} })
    ).resolves.toEqual({
      ok: true,
    });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[1][1].headers['x-step-up-token']).toBe('tok-1');
  });

  it('surfaces the refusal when the person cancels', async () => {
    fetchMock.mockResolvedValue(
      reply(403, { message: 'Confirm it’s you', error: 'STEP_UP_REQUIRED' })
    );
    registerStepUpPrompt(async () => null);
    await expect(apiFetch('/x', { method: 'POST' })).rejects.toMatchObject({
      code: 'STEP_UP_REQUIRED',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not prompt for other 403s', async () => {
    fetchMock.mockResolvedValue(reply(403, { message: 'No', error: 'Forbidden' }));
    const prompt = jest.fn();
    registerStepUpPrompt(prompt);
    await expect(apiFetch('/x')).rejects.toBeInstanceOf(ApiError);
    expect(prompt).not.toHaveBeenCalled();
  });

  it('forgets a token shortly before it expires', () => {
    rememberStepUpToken('t', 600, 0);
    expect(currentStepUpToken(569_000)).toBe('t');
    expect(currentStepUpToken(571_000)).toBeNull();
  });
});
