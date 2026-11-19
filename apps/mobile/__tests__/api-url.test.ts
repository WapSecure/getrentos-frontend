import { resolveApiUrl } from '@/lib/env';

describe('resolveApiUrl', () => {
  describe('release builds', () => {
    it('accepts an https URL and trims the trailing slash', () => {
      expect(
        resolveApiUrl({
          explicit: 'https://api.getsureground.io/',
          hostUri: undefined,
          isDev: false,
        })
      ).toBe('https://api.getsureground.io');
    });

    it.each(['http://api.getsureground.io', 'http://192.168.1.4:4000', 'api.getsureground.io'])(
      'refuses %s',
      (explicit) => {
        expect(() => resolveApiUrl({ explicit, hostUri: undefined, isDev: false })).toThrow(
          /must be an https:\/\/ URL/
        );
      }
    );

    it('refuses to fall back to the Metro host or localhost', () => {
      expect(() =>
        resolveApiUrl({ explicit: undefined, hostUri: '192.168.1.4:8081', isDev: false })
      ).toThrow(/https:\/\//);
    });

    it('lets the internal device-test profile opt in to a LAN backend', () => {
      expect(
        resolveApiUrl({
          explicit: 'http://172.20.10.6:4000',
          hostUri: undefined,
          isDev: false,
          allowInsecure: true,
        })
      ).toBe('http://172.20.10.6:4000');
    });
  });

  describe('development builds', () => {
    it('keeps an explicit http URL', () => {
      expect(
        resolveApiUrl({ explicit: 'http://localhost:4000/', hostUri: undefined, isDev: true })
      ).toBe('http://localhost:4000');
    });

    it('uses the Metro host on the LAN', () => {
      expect(resolveApiUrl({ explicit: undefined, hostUri: '192.168.1.4:8081', isDev: true })).toBe(
        'http://192.168.1.4:4000'
      );
    });

    it('falls back to localhost', () => {
      expect(resolveApiUrl({ explicit: undefined, hostUri: 'localhost:8081', isDev: true })).toBe(
        'http://localhost:4000'
      );
    });
  });
});
