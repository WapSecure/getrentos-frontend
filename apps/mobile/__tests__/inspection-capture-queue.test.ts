/**
 * The inspector's offline capture queue: photos survive until uploaded, a
 * retry never mockFiles twice, a dropped connection stops the drain, and a
 * permanent refusal is kept for the inspector to see.
 */

import { enqueueCapture, flushCaptures, loadCaptureQueue } from '../lib/inspectionCaptureQueue';
import { ApiError } from '../lib/api/client';

const mockStore = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => mockStore.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => void mockStore.set(k, v)),
  },
}));

const mockFiles = new Set<string>();
jest.mock('expo-file-system', () => {
  class Directory {
    uri: string;
    constructor(base: { uri: string } | string, name?: string) {
      this.uri = `${typeof base === 'string' ? base : base.uri}/${name ?? ''}`;
    }
    get exists() {
      return true;
    }
    create() {}
  }
  class File {
    uri: string;
    constructor(base: { uri: string } | string, name?: string) {
      this.uri = name ? `${typeof base === 'string' ? base : base.uri}/${name}` : String(base);
    }
    get exists() {
      return mockFiles.has(this.uri);
    }
    copy(dest: { uri: string }) {
      mockFiles.add(dest.uri);
    }
    delete() {
      mockFiles.delete(this.uri);
    }
  }
  return { Directory, File, Paths: { document: { uri: 'doc:' } } };
});

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

jest.mock('../lib/api/client', () => ({
  ApiError: class extends Error {
    readonly code: number;
    get status() {
      return this.code;
    }
    constructor(message: string, code: number) {
      super(message);
      this.code = code;
    }
  },
}));

const mockUploadEvidence = jest.fn();
jest.mock('../lib/api/landWatch', () => ({
  landWatchApi: { uploadEvidence: (...a: unknown[]) => mockUploadEvidence(...a) },
}));

const MockApiError = ApiError as unknown as new (message: string, status: number) => Error;

const capture = (ref: string) => ({
  clientRef: ref,
  inspectionId: 'insp-1',
  sourceUri: `cache:/${ref}.jpg`,
  name: `${ref}.jpg`,
  mimeType: 'image/jpeg',
  capturedAt: '2026-10-19T09:00:00.000Z',
  lat: 9.05,
  lng: 7.49,
  capturedOffline: true,
});
const stored = () => JSON.parse(mockStore.get('getrentos.land.inspection-captures') ?? '[]');

describe('inspection capture queue', () => {
  beforeEach(async () => {
    mockStore.clear();
    mockFiles.clear();
    mockUploadEvidence.mockReset();
    await loadCaptureQueue();
  });

  it('copies each photo out of the camera cache before queueing it', async () => {
    await enqueueCapture(capture('a'));
    expect(stored()).toEqual([
      expect.objectContaining({ clientRef: 'a', uri: 'doc:/inspection-captures/a.jpg' }),
    ]);
    expect(mockFiles.has('doc:/inspection-captures/a.jpg')).toBe(true);
  });

  it('uploads in order with the capture facts, then forgets the file', async () => {
    mockUploadEvidence.mockResolvedValue({ evidenceId: 'e', duplicate: false });
    await enqueueCapture(capture('a'));
    await enqueueCapture(capture('b'));
    expect(await flushCaptures()).toEqual({ uploaded: 2, failed: 0 });
    expect(mockUploadEvidence.mock.calls.map((c) => c[2].clientRef)).toEqual(['a', 'b']);
    expect(mockUploadEvidence.mock.calls[0][2]).toMatchObject({
      capturedOffline: true,
      lat: 9.05,
      lng: 7.49,
    });
    expect(stored()).toEqual([]);
    expect(mockFiles.size).toBe(0);
  });

  it('treats a duplicate answer as done (the server kept the first upload)', async () => {
    mockUploadEvidence.mockResolvedValue({ evidenceId: 'e', duplicate: true });
    await enqueueCapture(capture('a'));
    expect((await flushCaptures()).uploaded).toBe(1);
    expect(stored()).toEqual([]);
  });

  it('stops at a dropped connection and keeps everything for the next try', async () => {
    mockUploadEvidence.mockRejectedValueOnce(new TypeError('Network request failed'));
    await enqueueCapture(capture('a'));
    await enqueueCapture(capture('b'));
    expect(await flushCaptures()).toEqual({ uploaded: 0, failed: 0 });
    expect(mockUploadEvidence).toHaveBeenCalledTimes(1);
    expect(stored().map((i: { clientRef: string }) => i.clientRef)).toEqual(['a', 'b']);
  });

  it('keeps a permanent refusal with its reason and moves on', async () => {
    mockUploadEvidence
      .mockRejectedValueOnce(new MockApiError('This inspection is not open for evidence', 400))
      .mockResolvedValueOnce({ evidenceId: 'e', duplicate: false });
    await enqueueCapture(capture('a'));
    await enqueueCapture(capture('b'));
    expect(await flushCaptures()).toEqual({ uploaded: 1, failed: 1 });
    expect(stored()).toEqual([
      expect.objectContaining({
        clientRef: 'a',
        error: 'This inspection is not open for evidence',
      }),
    ]);
    // A refused capture is not retried on its own.
    mockUploadEvidence.mockClear();
    await flushCaptures();
    expect(mockUploadEvidence).not.toHaveBeenCalled();
  });
});
