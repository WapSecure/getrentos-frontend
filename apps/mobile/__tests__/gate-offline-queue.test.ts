import AsyncStorage from '@react-native-async-storage/async-storage';
import { gateOfflineQueue, replayGateQueue } from '@/lib/gateOfflineQueue';
import { gatemanApi } from '@/lib/api/gateman';

jest.mock('@/lib/api/gateman', () => ({
  gatemanApi: { verifyVisitorPass: jest.fn(async () => ({})) },
}));

const checkIn = (pin: string) => ({
  estateId: 'e1',
  pin,
  occurredAt: '2026-11-18T10:00:00.000Z',
  label: `PIN ${pin}`,
});

beforeEach(async () => {
  await gateOfflineQueue.clear();
  jest.mocked(gatemanApi.verifyVisitorPass).mockClear();
});

describe('offline gate queue', () => {
  it("never sends one guard's saved check-ins with another guard's session", async () => {
    await gateOfflineQueue.setOwner('guard-a');
    await gateOfflineQueue.enqueue('check-in', checkIn('1111'));

    await gateOfflineQueue.setOwner('guard-b');
    expect(gateOfflineQueue.getSnapshot()).toEqual([]);
    expect(await replayGateQueue()).toBeNull();
    expect(gatemanApi.verifyVisitorPass).not.toHaveBeenCalled();
  });

  it("keeps a guard's writes across an expired session and sends them when they return", async () => {
    await gateOfflineQueue.setOwner('guard-a');
    await gateOfflineQueue.enqueue('check-in', checkIn('2222'));
    await gateOfflineQueue.setOwner(null);
    await gateOfflineQueue.setOwner('guard-a');

    const summary = await replayGateQueue();
    expect(summary?.sent).toBe(1);
  });

  it('drops the queue, PINs included, on sign-out', async () => {
    await gateOfflineQueue.setOwner('guard-a');
    await gateOfflineQueue.enqueue('check-in', checkIn('3333'));
    await gateOfflineQueue.clear();

    expect(await AsyncStorage.getItem('sureground.gate.offline-queue')).toBeNull();
    expect(gateOfflineQueue.getSnapshot()).toEqual([]);
  });

  it('refuses to save a write with nobody signed in', async () => {
    await expect(gateOfflineQueue.enqueue('check-in', checkIn('4444'))).rejects.toThrow();
  });
});
