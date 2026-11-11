import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, apiUpload } from '../src/auth/apiClient.ts';

type Listener = (event: { lengthComputable: boolean; loaded: number; total: number }) => void;

/** Just enough XMLHttpRequest for apiUpload; each test drives `last` by hand. */
class FakeXhr {
  static last: FakeXhr;
  status = 0;
  responseText = '';
  headers: Record<string, string> = {};
  sent: unknown;
  url = '';
  withCredentials = false;
  requestHeaders: Record<string, string> = {};
  upload: { onprogress?: Listener } = {};
  onload?: () => void;
  onerror?: () => void;
  onabort?: () => void;
  constructor() {
    FakeXhr.last = this;
  }
  open(_method: string, url: string) {
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.requestHeaders[name] = value;
  }
  getResponseHeader(name: string) {
    return this.headers[name.toLowerCase()] ?? null;
  }
  send(body: unknown) {
    this.sent = body;
  }
  abort() {
    this.onabort?.();
  }
  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.headers['content-type'] = 'application/json';
    this.onload?.();
  }
}
(globalThis as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest = FakeXhr;

test('reports whole-percent progress once each and resolves with the body', async () => {
  const seen: number[] = [];
  const done = apiUpload<{ key: string }>(
    '/x/upload',
    new FormData(),
    { Authorization: 'Bearer t' },
    { onProgress: (p) => seen.push(p) }
  );
  const xhr = FakeXhr.last;
  assert.equal(xhr.withCredentials, true);
  assert.equal(xhr.requestHeaders.Authorization, 'Bearer t');
  assert.ok(xhr.url.endsWith('/x/upload'));
  for (const loaded of [0, 10, 10.4, 50, 100]) {
    xhr.upload.onprogress?.({ lengthComputable: true, loaded, total: 100 });
  }
  xhr.respond(201, { key: 'k1' });
  assert.deepEqual(await done, { key: 'k1' });
  assert.deepEqual(seen, [0, 10, 50, 100]);
});

test('turns an error response into an ApiError with the server message', async () => {
  const done = apiUpload('/x/upload', new FormData());
  FakeXhr.last.respond(400, { message: 'That file is too large.', error: 'FILE_TOO_LARGE' });
  await assert.rejects(done, (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 400);
    assert.equal(error.code, 'FILE_TOO_LARGE');
    return true;
  });
});

test('a network failure is a status 0 ApiError', async () => {
  const done = apiUpload('/x/upload', new FormData());
  FakeXhr.last.onerror?.();
  await assert.rejects(done, (error: unknown) => error instanceof ApiError && error.status === 0);
});

test('cancelling rejects with an AbortError', async () => {
  const controller = new AbortController();
  const done = apiUpload('/x/upload', new FormData(), {}, { signal: controller.signal });
  controller.abort();
  await assert.rejects(done, (error: unknown) => (error as Error).name === 'AbortError');
  await assert.rejects(
    apiUpload('/x/upload', new FormData(), {}, { signal: controller.signal }),
    (error: unknown) => (error as Error).name === 'AbortError'
  );
});
