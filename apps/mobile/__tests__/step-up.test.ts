import { apiFetch, ApiError } from '@/lib/api/client';
import {
  clearStepUpToken,
  registerStepUpPrompt,
  rememberStepUpToken,
  currentStepUpToken,
  currentStepUpSummary,
  withStepUpSummary,
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
    globalThis.fetch = fetchMock as never;
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

  it('tells the prompt what is being authorised, then forgets it', async () => {
    fetchMock
      .mockResolvedValueOnce(reply(403, { message: 'Confirm it’s you', error: 'STEP_UP_REQUIRED' }))
      .mockResolvedValueOnce(reply(200, { ok: true }));
    const prompt = jest.fn().mockResolvedValue('tok-2');
    registerStepUpPrompt(prompt);
    await withStepUpSummary('Withdraw ₦250,000 to GTBank ••••1234', () =>
      apiFetch('/realtor/payouts/request', { method: 'POST' })
    );
    expect(prompt).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Withdraw ₦250,000 to GTBank ••••1234' })
    );
    expect(currentStepUpSummary()).toBeNull();
  });

  it('forgets a token shortly before it expires', () => {
    rememberStepUpToken('t', 600, 0);
    expect(currentStepUpToken(569_000)).toBe('t');
    expect(currentStepUpToken(571_000)).toBeNull();
  });

  describe('bound confirmations (security gap AU-02)', () => {
    it('asks the sheet for the challenge the API raised and does not keep the token', async () => {
      fetchMock
        .mockResolvedValueOnce(
          reply(403, {
            message: 'Confirm it’s you',
            error: 'STEP_UP_REQUIRED',
            challengeId: 'ch-1',
          })
        )
        .mockResolvedValueOnce(reply(200, { ok: true }));
      const prompt = jest.fn().mockResolvedValue('bound-tok');
      registerStepUpPrompt(prompt);

      await apiFetch('/host/shortlets/payouts/request', { method: 'POST', body: {} });

      expect(prompt).toHaveBeenCalledWith(expect.objectContaining({ challengeId: 'ch-1' }));
      const replay = fetchMock.mock.calls[1][1] as { headers: Record<string, string> };
      expect(replay.headers['x-step-up-token']).toBe('bound-tok');
      // Single-use: nothing cached for the next sensitive request.
      expect(currentStepUpToken()).toBeNull();
    });

    it('asks again for a second request rather than reusing the first confirmation', async () => {
      fetchMock
        .mockResolvedValueOnce(reply(403, { error: 'STEP_UP_REQUIRED', challengeId: 'ch-1' }))
        .mockResolvedValueOnce(reply(200, { ok: true }))
        .mockResolvedValueOnce(reply(403, { error: 'STEP_UP_REQUIRED', challengeId: 'ch-2' }))
        .mockResolvedValueOnce(reply(200, { ok: true }));
      const prompt = jest.fn().mockResolvedValueOnce('tok-a').mockResolvedValueOnce('tok-b');
      registerStepUpPrompt(prompt);

      await apiFetch('/a', { method: 'POST', body: { amount: 1 } });
      await apiFetch('/b', { method: 'POST', body: { amount: 2 } });

      expect(prompt.mock.calls.map(([request]) => request.challengeId)).toEqual(['ch-1', 'ch-2']);
    });
  });
});
