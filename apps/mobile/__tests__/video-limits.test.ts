import { MAX_VIDEO_BYTES, videoProblem } from '@getrentos/shared';

describe('videoProblem', () => {
  it('accepts a short, small tour and anything unmeasured', () => {
    expect(videoProblem({ size: 40 * 1024 * 1024, durationSeconds: 95 })).toBeNull();
    expect(videoProblem({})).toBeNull();
    // A recording stopped at exactly 5:00 can report a fraction over.
    expect(videoProblem({ durationSeconds: 300.4 })).toBeNull();
  });

  it('refuses a file over 150 MB or a tour over 5 minutes', () => {
    expect(videoProblem({ size: MAX_VIDEO_BYTES + 1 })).toMatch(/150 MB/);
    expect(videoProblem({ durationSeconds: 6 * 60 })).toMatch(/5 minutes/);
  });
});
