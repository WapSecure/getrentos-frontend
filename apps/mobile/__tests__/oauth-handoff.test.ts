import { startOAuth } from '@/lib/auth/oauth';
// The app's test types are Jest's only (no @types/node), so Node's crypto is typed here for the two calls used.
type NodeCrypto = {
  createHash(alg: 'sha256'): {
    update(value: string): { digest(enc: 'base64' | 'base64url'): string };
  };
  randomBytes(size: number): { toString(enc: 'base64url'): string };
};
const { createHash, randomBytes } = jest.requireActual<NodeCrypto>('crypto');

jest.mock('@/lib/env', () => ({ env: { apiUrl: 'https://api.test', clientApp: 'mobile' } }));
jest.mock('expo-crypto', () => {
  const nodeCrypto = jest.requireActual('crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    CryptoEncoding: { BASE64: 'base64' },
    getRandomBytes: (n: number) => new Uint8Array(nodeCrypto.randomBytes(n)),
    digestStringAsync: async (_alg: string, value: string) =>
      nodeCrypto.createHash('sha256').update(value).digest('base64'),
  };
});
const mockOpenAuthSessionAsync = jest.fn();
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: (...args: unknown[]) => mockOpenAuthSessionAsync(...args),
}));

describe('native Google sign-in handoff (AU-17)', () => {
  beforeEach(() => {
    mockOpenAuthSessionAsync.mockReset();
    globalThis.fetch = jest.fn();
  });

  it('sends only the hash of its secret and swaps the redirect code with the secret', async () => {
    const code = randomBytes(32).toString('base64url');
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: `sureground://oauth#code=${code}`,
    });
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'at', refresh_token: 'rt', expires_in: '900' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(startOAuth('google')).resolves.toEqual({
      kind: 'session',
      accessToken: 'at',
      refreshToken: 'rt',
    });

    const authUrl = new URL(mockOpenAuthSessionAsync.mock.calls[0][0]);
    const challenge = authUrl.searchParams.get('app_challenge')!;
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.test/auth/oauth/native/exchange');
    const body = JSON.parse(init.body);
    expect(body.code).toBe(code);
    expect(createHash('sha256').update(body.verifier).digest('base64url')).toBe(challenge);
  });

  it('finishes with the authenticator code when the exchange returns a challenge', async () => {
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: `sureground://oauth#code=${'a'.repeat(43)}`,
    });
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ challenge_token: 'ch' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    await expect(startOAuth('google')).resolves.toEqual({
      kind: 'challenge',
      challengeToken: 'ch',
    });
  });

  it('shows the server’s message when an old flow is refused', async () => {
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'sureground://oauth#error=Please+update+the+Sureground+app+to+sign+in+with+Google.',
    });
    await expect(startOAuth('google')).rejects.toThrow('Please update the Sureground app');
  });
});
