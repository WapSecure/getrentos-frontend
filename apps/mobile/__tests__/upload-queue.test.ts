import {
  createUploadQueue,
  UPLOAD_FALLBACK_ERROR,
  uploadsBusy,
  uploadsFailed,
  type UploadState,
  type UploadTaskOptions,
} from '../lib/uploadQueue';

interface Call {
  file: string;
  options: UploadTaskOptions;
  resolve: (key: string) => void;
  reject: (error: unknown) => void;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

function setup(concurrency?: number) {
  const calls: Call[] = [];
  const done: [string, string][] = [];
  let states: Record<string, UploadState> = {};
  const queue = createUploadQueue<string, string>({
    concurrency,
    upload: (file, options) =>
      new Promise<string>((resolve, reject) => calls.push({ file, options, resolve, reject })),
    onSuccess: (id, key) => done.push([id, key]),
    onChange: (next) => (states = next),
  });
  return { queue, calls, done, states: () => states };
}

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, file: `f${i + 1}` }));

describe('createUploadQueue', () => {
  it('sends at most 3 at a time and starts the next as one finishes', async () => {
    const { queue, calls, done, states } = setup();
    queue.add(items(5));
    expect(calls.map((c) => c.file)).toEqual(['f1', 'f2', 'f3']);
    expect(states().p4).toEqual({ status: 'queued', progress: 0 });
    expect(states().p1).toEqual({ status: 'uploading', progress: 0 });

    calls[1]!.resolve('k2');
    await flush();
    expect(done).toEqual([['p2', 'k2']]);
    expect(states().p2).toBeUndefined();
    expect(calls.map((c) => c.file)).toEqual(['f1', 'f2', 'f3', 'f4']);
  });

  it('honours a custom concurrency', () => {
    const { queue, calls } = setup(1);
    queue.add(items(3));
    expect(calls).toHaveLength(1);
  });

  it('reports progress per file', () => {
    const { queue, calls, states } = setup();
    queue.add(items(2));
    calls[0]!.options.onProgress(40);
    expect(states().p1).toEqual({ status: 'uploading', progress: 40 });
    expect(states().p2).toEqual({ status: 'uploading', progress: 0 });
  });

  it('marks a failure with its reason and lets the others carry on', async () => {
    const { queue, calls, done, states } = setup(1);
    queue.add(items(2));
    calls[0]!.reject(new Error('File too large'));
    await flush();
    expect(states().p1).toEqual({ status: 'failed', progress: 0, error: 'File too large' });
    expect(calls.map((c) => c.file)).toEqual(['f1', 'f2']);
    calls[1]!.resolve('k2');
    await flush();
    expect(done).toEqual([['p2', 'k2']]);
    expect(uploadsFailed(states())).toBe(1);
    expect(uploadsBusy(states())).toBe(false);
  });

  it('uses a plain message when the error has none', async () => {
    const { queue, calls, states } = setup();
    queue.add(items(1));
    calls[0]!.reject('boom');
    await flush();
    expect(states().p1).toEqual({ status: 'failed', progress: 0, error: UPLOAD_FALLBACK_ERROR });
  });

  it('retries a failed file with the same file', async () => {
    const { queue, calls, done } = setup();
    queue.add(items(1));
    calls[0]!.reject(new Error('Network request failed.'));
    await flush();
    queue.retry('p1');
    expect(calls).toHaveLength(2);
    expect(calls[1]!.file).toBe('f1');
    calls[1]!.resolve('k1');
    await flush();
    expect(done).toEqual([['p1', 'k1']]);
  });

  it('ignores a retry for a file that is already sending', () => {
    const { queue, calls } = setup();
    queue.add(items(1));
    queue.retry('p1');
    expect(calls).toHaveLength(1);
  });

  it('cancels a running upload, forgets it and starts the next', async () => {
    const { queue, calls, done, states } = setup(1);
    queue.add(items(2));
    queue.cancel('p1');
    expect(calls[0]!.options.signal.aborted).toBe(true);
    expect(states().p1).toBeUndefined();
    expect(calls.map((c) => c.file)).toEqual(['f1', 'f2']);

    // A late answer for the cancelled file changes nothing.
    calls[0]!.resolve('k1');
    await flush();
    expect(done).toEqual([]);
    expect(states().p1).toBeUndefined();
  });

  it('drops a cancelled file that was still waiting', () => {
    const { queue, calls, states } = setup(1);
    queue.add(items(2));
    queue.cancel('p2');
    expect(states().p2).toBeUndefined();
    calls[0]!.options.onProgress(100);
    expect(calls).toHaveLength(1);
  });

  it('does not report an abort as a failure', async () => {
    const { queue, calls, states } = setup();
    queue.add(items(1));
    const abort = new Error('The upload was cancelled.');
    abort.name = 'AbortError';
    calls[0]!.reject(abort);
    await flush();
    expect(states().p1?.status).toBe('uploading');
  });

  it('puts an uploaded file back as failed, ready to retry', async () => {
    const { queue, calls, states } = setup();
    queue.add(items(1));
    calls[0]!.resolve('k1');
    await flush();
    queue.fail('p1', 'f1', 'Could not add this photo to the property.');
    expect(states().p1).toEqual({
      status: 'failed',
      progress: 0,
      error: 'Could not add this photo to the property.',
    });
    queue.retry('p1');
    expect(calls).toHaveLength(2);
  });

  it('cancels everything on dispose and then stays quiet', async () => {
    const { queue, calls, done } = setup(1);
    queue.add(items(2));
    queue.dispose();
    expect(calls[0]!.options.signal.aborted).toBe(true);
    calls[0]!.resolve('k1');
    await flush();
    expect(done).toEqual([]);
    expect(calls).toHaveLength(1);
  });
});
