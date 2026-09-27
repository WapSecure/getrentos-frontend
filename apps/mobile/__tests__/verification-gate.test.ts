import { apiFetch, ApiError } from '@/lib/api/client';
import { readGate } from '@/lib/verificationGate';

/** A 403 exactly as the API's exception filter writes it. */
function forbidden(body: Record<string, unknown>) {
  return Promise.resolve(
    new Response(JSON.stringify({ statusCode: 403, ...body }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

async function thrown(body: Record<string, unknown>): Promise<unknown> {
  globalThis.fetch = jest.fn(() => forbidden(body)) as unknown as typeof fetch;
  try {
    await apiFetch('/buyer/offers', { method: 'POST', anonymous: true });
  } catch (err) {
    return err;
  }
  throw new Error('expected the request to fail');
}

describe('verification gates', () => {
  it('reads the tier fields under the names the API sends (`required`, `tier`)', async () => {
    const err = await thrown({
      error: 'TRUST_TIER_REQUIRED',
      message: 'Trust tier 3 required',
      required: 3,
      tier: 2,
    });
    expect(err).toBeInstanceOf(ApiError);
    // The projections `readGate` reads, under the caller's names.
    expect((err as ApiError).details).toMatchObject({ tierRequired: 3, currentTier: 2 });
    // And the verbatim envelope alongside them, which is the half that has to
    // survive for refusals a caller must ACT on rather than print: the gate's
    // watch list answers 403 with the entries that fired, and a guard cannot
    // judge an override from a message alone. `toEqual` here would pin only the
    // two named fields and quietly drop the rest.
    expect((err as ApiError).details).toMatchObject({
      error: 'TRUST_TIER_REQUIRED',
      required: 3,
      tier: 2,
    });
    expect(readGate(err)?.message).toBe(
      "You're on Trust Tier 2 (identity verified). This needs financial verification (Trust Tier 3)."
    );
  });

  it('points at the trust score, not verification, when only the score is short', async () => {
    const gate = readGate(
      await thrown({
        error: 'TRUST_TIER_REQUIRED',
        required: 3,
        tier: 3,
        reason: 'SCORE_BELOW_TIER3_MIN',
      })
    );
    expect(gate?.scoreWithheld).toBe(true);
    expect(gate?.cta).toBe('See what your score needs');
  });

  it('explains an identity gate', async () => {
    expect(readGate(await thrown({ error: 'IDENTITY_REQUIRED' }))?.cta).toBe('Verify identity');
  });

  it('ignores ordinary failures', async () => {
    expect(readGate(await thrown({ error: 'FORBIDDEN', message: 'Not yours' }))).toBeNull();
    expect(readGate(new Error('boom'))).toBeNull();
  });
});
