import { videoCallState } from '@getrentos/shared';

describe('videoCallState', () => {
  const at = '2026-10-20T10:00:00.000Z';
  const v = { mode: 'video', status: 'confirmed', scheduledAt: at };
  const now = (iso: string) => new Date(iso);

  it('has no call for visits or unconfirmed viewings', () => {
    expect(videoCallState({ ...v, mode: 'in_person' }).state).toBe('none');
    expect(videoCallState({ ...v, status: 'requested' }).state).toBe('none');
    expect(videoCallState({ ...v, scheduledAt: undefined }).state).toBe('none');
  });

  it('opens 15 minutes before and closes 2 hours after', () => {
    expect(videoCallState(v, now('2026-10-20T09:44:00Z'))).toEqual({
      state: 'upcoming',
      opensAt: new Date('2026-10-20T09:45:00Z'),
    });
    expect(videoCallState(v, now('2026-10-20T09:45:00Z')).state).toBe('open');
    expect(videoCallState(v, now('2026-10-20T12:00:00Z')).state).toBe('open');
    expect(videoCallState(v, now('2026-10-20T12:00:01Z')).state).toBe('ended');
  });
});
