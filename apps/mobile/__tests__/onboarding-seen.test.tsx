import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { __resetOnboardingCacheForTests, useOnboardingSeen } from '@/lib/onboarding';

// jest.mock is hoisted above imports, so the documented mock has to be required inline.
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetOnboardingCacheForTests();
});

describe('onboarding seen flag', () => {
  it('reads the stored value', async () => {
    await AsyncStorage.setItem('getrentos.onboardingSeen', '1');
    const { result } = await renderHook(() => useOnboardingSeen());
    await waitFor(() => expect(result.current.seen).toBe(true));
  });

  it('marking it seen in one screen updates the root router too', async () => {
    // Two independent callers — the onboarding screen and the root layout.
    const screen = await renderHook(() => useOnboardingSeen());
    const root = await renderHook(() => useOnboardingSeen());
    await waitFor(() => expect(root.result.current.seen).toBe(false));

    await act(async () => screen.result.current.markSeen());

    expect(root.result.current.seen).toBe(true);
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('getrentos.onboardingSeen')).toBe('1')
    );
  });
});
