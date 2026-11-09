import {
  EMBED_FRAME_ORIGINS,
  MAP_TILE_ORIGINS,
  SMILE_LIVE_CAPTURE_ORIGINS,
  buildContentSecurityPolicy,
  cspHeaderName,
  cspReportUri,
  httpOrigin,
  isLocalHost,
  mapTiles,
  parseOriginList,
  websocketOrigin,
} from '@sureground/shared';

/** Policy string → { directive: sources[] }. */
function directives(policy: string): Record<string, string[]> {
  return Object.fromEntries(
    policy.split('; ').map((part) => {
      const [name, ...sources] = part.split(' ');
      return [name, sources];
    })
  );
}

describe('buildContentSecurityPolicy', () => {
  const base = { nonce: 'abc123==', apiUrl: 'https://api.getsureground.io/v1' };

  it('locks scripts to the nonce with strict-dynamic, without unsafe-eval in production', () => {
    const d = directives(buildContentSecurityPolicy({ ...base, dev: false }));
    expect(d['script-src']).toEqual(["'self'", "'nonce-abc123=='", "'strict-dynamic'"]);
    expect(d['script-src']).not.toContain("'unsafe-inline'");
  });

  it("allows 'unsafe-eval' and local origins only in development", () => {
    const d = directives(buildContentSecurityPolicy({ ...base, dev: true }));
    expect(d['script-src']).toContain("'unsafe-eval'");
    expect(d['connect-src']).toEqual(
      expect.arrayContaining(['http://localhost:*', 'ws://localhost:*'])
    );
    const prod = directives(buildContentSecurityPolicy({ ...base, dev: false }));
    expect(prod['connect-src']).not.toContain('http://localhost:*');
  });

  it('allows the API origin (and its websocket) from the env URL', () => {
    const d = directives(buildContentSecurityPolicy({ ...base, dev: false }));
    expect(d['connect-src']).toEqual([
      "'self'",
      'https://api.getsureground.io',
      'wss://api.getsureground.io',
    ]);
    expect(d['img-src']).toEqual(["'self'", 'data:', 'blob:', 'https://api.getsureground.io']);
    expect(d['frame-src']).toContain('https://api.getsureground.io');
  });

  it('ignores a missing or malformed API URL', () => {
    const d = directives(
      buildContentSecurityPolicy({ nonce: 'n', dev: false, apiUrl: 'not a url' })
    );
    expect(d['connect-src']).toEqual(["'self'"]);
  });

  it('adds per-app origins and media origins without duplicates', () => {
    const d = directives(
      buildContentSecurityPolicy({
        ...base,
        dev: false,
        mediaOrigins: ['https://cdn.getsureground.io', 'https://api.getsureground.io'],
        imgSrc: MAP_TILE_ORIGINS,
        frameSrc: EMBED_FRAME_ORIGINS,
      })
    );
    expect(d['img-src']).toEqual(
      expect.arrayContaining([...MAP_TILE_ORIGINS, 'https://cdn.getsureground.io'])
    );
    expect(d['img-src'].filter((s) => s === 'https://api.getsureground.io')).toHaveLength(1);
    expect(d['media-src']).toContain('https://cdn.getsureground.io');
    expect(d['frame-src']).toEqual(
      expect.arrayContaining(['https://www.youtube-nocookie.com', 'https://*.matterport.com'])
    );
  });

  it('sets the fixed hardening directives', () => {
    const d = directives(buildContentSecurityPolicy({ ...base, dev: false }));
    expect(d['default-src']).toEqual(["'self'"]);
    expect(d['style-src']).toEqual(["'self'", "'unsafe-inline'"]);
    expect(d['font-src']).toEqual(["'self'", 'data:']);
    expect(d['object-src']).toEqual(["'none'"]);
    expect(d['base-uri']).toEqual(["'self'"]);
    expect(d['form-action']).toEqual(["'self'"]);
    expect(d['frame-ancestors']).toEqual(["'none'"]);
  });

  it('adds upgrade-insecure-requests and report-uri only when asked', () => {
    const plain = buildContentSecurityPolicy({ ...base, dev: false });
    expect(plain).not.toContain('upgrade-insecure-requests');
    expect(plain).not.toContain('report-uri');
    const d = directives(
      buildContentSecurityPolicy({
        ...base,
        dev: false,
        upgradeInsecureRequests: true,
        reportUri: 'https://csp.example/report',
      })
    );
    expect(d['upgrade-insecure-requests']).toEqual([]);
    expect(d['report-uri']).toEqual(['https://csp.example/report']);
  });
});

describe('csp helpers', () => {
  it('derives origins', () => {
    expect(httpOrigin('http://localhost:4000/api')).toBe('http://localhost:4000');
    expect(httpOrigin('javascript:alert(1)')).toBeNull();
    expect(websocketOrigin('https://api.x.com/v1')).toBe('wss://api.x.com');
    expect(websocketOrigin('http://localhost:4000')).toBe('ws://localhost:4000');
  });

  it('parses an env origin list, dropping junk', () => {
    expect(parseOriginList(' https://a.com/x, http://b.com  bad ')).toEqual([
      'https://a.com',
      'http://b.com',
    ]);
    expect(parseOriginList(undefined)).toEqual([]);
  });

  it('recognises local hosts from a Host header', () => {
    expect(isLocalHost('localhost')).toBe(true);
    expect(isLocalHost('localhost:3100')).toBe(true);
    expect(isLocalHost('127.0.0.1:3000')).toBe(true);
    expect(isLocalHost('[::1]:3000')).toBe(true);
    expect(isLocalHost(null)).toBe(true);
    expect(isLocalHost('app.getsureground.io')).toBe(false);
    expect(isLocalHost('app.getsureground.io, localhost')).toBe(false);
  });

  it('covers both map tile providers', () => {
    const allowed = (url: string) => {
      const host = new URL(url.replace('{s}', 'a')).host;
      return MAP_TILE_ORIGINS.some((o) => {
        const pattern = o.replace('https://', '');
        return pattern.startsWith('*.') ? host.endsWith(pattern.slice(1)) : host === pattern;
      });
    };
    expect(allowed(mapTiles('pk.test', 'light').url)).toBe(true);
    expect(allowed(mapTiles(null, 'light').url)).toBe(true);
  });

  it('names the header for enforce vs report-only', () => {
    expect(cspHeaderName(true)).toBe('Content-Security-Policy');
    expect(cspHeaderName(false)).toBe('Content-Security-Policy-Report-Only');
  });

  describe('live selfie pages (Smile ID web capture)', () => {
    const base = { nonce: 'abc', dev: false, apiUrl: 'https://api.getsureground.io' };
    const directive = (policy: string, name: string) =>
      policy.split('; ').find((d) => d.startsWith(`${name} `)) ?? '';

    it('allows WebAssembly, blob workers and Smile hosts only where asked', () => {
      const capture = buildContentSecurityPolicy({ ...base, liveCapture: true });
      expect(directive(capture, 'script-src')).toContain("'wasm-unsafe-eval'");
      expect(directive(capture, 'script-src')).not.toContain("'unsafe-eval'");
      expect(directive(capture, 'worker-src')).toBe("worker-src 'self' blob:");
      for (const origin of SMILE_LIVE_CAPTURE_ORIGINS)
        expect(directive(capture, 'connect-src')).toContain(origin);

      const plain = buildContentSecurityPolicy(base);
      expect(plain).not.toContain('wasm-unsafe-eval');
      expect(plain).not.toContain('smileidentity');
      expect(plain).not.toContain('worker-src');
    });
  });
});

describe('cspReportUri (security gap CI-02)', () => {
  it('uses CSP_REPORT_URI when set', () => {
    expect(cspReportUri(' https://reports.example.com/csp ', 'https://api.example.com')).toBe(
      'https://reports.example.com/csp'
    );
  });

  it("defaults to the API's receiver, so a report-only rollout collects data", () => {
    expect(cspReportUri(undefined, 'https://api.example.com/')).toBe(
      'https://api.example.com/security/csp-report'
    );
    expect(cspReportUri('', 'https://api.example.com/v1')).toBe(
      'https://api.example.com/v1/security/csp-report'
    );
  });

  it('sends nowhere without a usable API URL', () => {
    expect(cspReportUri(undefined, undefined)).toBeNull();
    expect(cspReportUri(undefined, 'not a url')).toBeNull();
  });
});
