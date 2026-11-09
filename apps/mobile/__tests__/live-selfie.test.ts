import { liveSelfieOutcome } from '@/lib/smileid/liveSelfie';

describe('liveSelfieOutcome', () => {
  it('treats "success" as sent, not as passed: the server decides', () => {
    expect(liveSelfieOutcome({ status: 'success' })).toEqual({
      submitted: true,
      tone: 'success',
      text: 'Selfie sent. We are checking it now.',
    });
  });

  it('says nothing when the person backs out', () => {
    expect(liveSelfieOutcome({ status: 'cancelled' })).toBeNull();
  });

  it('asks for another try on a failure, without refreshing the check', () => {
    expect(liveSelfieOutcome({ status: 'failure' })).toMatchObject({
      submitted: false,
      tone: 'error',
    });
  });
});

describe('liveSelfieSupported', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('react-native');
  });

  const load = (os: string) => {
    jest.doMock('react-native', () => ({ Platform: { OS: os } }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@/lib/smileid/liveSelfie') as typeof import('@/lib/smileid/liveSelfie');
  };

  it('is off on the web: Smile ID has no browser capture here', () => {
    expect(load('web').liveSelfieSupported()).toBe(false);
  });

  it('is off where the face analyzer cannot load (Expo Go, tests)', () => {
    // The platform-neutral stub returns null, like a build without Smile ID's native code.
    expect(load('ios').liveSelfieSupported()).toBe(false);
  });
});
