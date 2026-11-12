import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  StorageUploadError,
  missingParts,
  partRange,
  putToStorage,
  retryDelayMs,
  videoContentType,
} from './storageUpload';

/** Just enough XMLHttpRequest to drive putToStorage: records the request and lets each test finish it. */
class FakeXhr {
  static last: FakeXhr;
  method = '';
  url = '';
  headers: Record<string, string> = {};
  body: unknown;
  status = 0;
  withCredentials = false;
  upload: {
    onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void;
  } = {};
  onload?: () => void;
  onerror?: () => void;
  onabort?: () => void;
  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: unknown) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
  finish(status: number) {
    this.status = status;
    this.onload?.();
  }
}
(globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = FakeXhr;

const session = {
  key: 'landlord/u1/property-media/abc-tour.mp4',
  uploadUrl: 'https://store.test/landlord/u1/property-media/abc-tour.mp4?X-Amz-Signature=x',
  method: 'PUT' as const,
  headers: { 'Content-Type': 'video/mp4' },
  expiresAt: '2026-11-11T12:15:00.000Z',
};
const file = new Blob([new Uint8Array(10)], { type: 'video/mp4' });

test('videoContentType trusts a known video type, otherwise the extension', () => {
  assert.equal(videoContentType({ name: 'a.mp4', type: 'video/mp4' }), 'video/mp4');
  assert.equal(videoContentType({ name: 'IMG_0001.MOV', type: '' }), 'video/quicktime');
  assert.equal(
    videoContentType({ name: 'clip.webm', type: 'application/octet-stream' }),
    'video/webm'
  );
});

test('PUTs the file to the signed link with only the signed headers, and reports progress', async () => {
  const progress: number[] = [];
  const sent = putToStorage(session, file, { onProgress: (p) => progress.push(p) });
  const xhr = FakeXhr.last;
  assert.equal(xhr.method, 'PUT');
  assert.equal(xhr.url, session.uploadUrl);
  assert.deepEqual(xhr.headers, { 'Content-Type': 'video/mp4' });
  assert.equal(xhr.withCredentials, false);
  assert.equal(xhr.body, file);
  xhr.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 });
  xhr.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 });
  xhr.finish(200);
  await sent;
  assert.deepEqual(progress, [50]);
});

test('rejects with the status when storage refuses the file', async () => {
  const sent = putToStorage(session, file);
  FakeXhr.last.finish(403);
  await assert.rejects(
    sent,
    (err: unknown) => err instanceof StorageUploadError && err.status === 403
  );
});

test('a cancel aborts the request', async () => {
  const controller = new AbortController();
  const sent = putToStorage(session, file, { signal: controller.signal });
  controller.abort();
  await assert.rejects(sent, { name: 'AbortError' });
});

test('partRange splits a file into parts with the remainder last', () => {
  const size = 8 * 2 + 3;
  assert.deepEqual(partRange(size, 8, 1), { start: 0, end: 8 });
  assert.deepEqual(partRange(size, 8, 3), { start: 16, end: 19 });
});

test('missingParts lists only the parts storage does not hold', () => {
  assert.deepEqual(missingParts(5, [1, 3]), [2, 4, 5]);
  assert.deepEqual(missingParts(2, [1, 2]), []);
});

test('retryDelayMs backs off and caps', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(retryDelayMs), [1000, 2000, 4000, 8000, 8000]);
});
