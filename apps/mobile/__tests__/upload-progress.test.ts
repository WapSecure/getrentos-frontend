import { ApiError, apiUploadWithProgress, configureApi } from '../lib/api/client';

jest.mock('../lib/auth/installId', () => ({ getInstallId: async () => 'install-1' }));

class FakeXhr {
  static sent: FakeXhr[] = [];
  upload: { onprogress: ((e: Partial<ProgressEvent>) => void) | null } = { onprogress: null };
  headers: Record<string, string> = {};
  url = '';
  status = 0;
  responseText = '';
  contentType = 'application/json';
  aborted = false;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  open(_method: string, url: string) {
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  getResponseHeader(name: string) {
    return name.toLowerCase() === 'content-type' ? this.contentType : null;
  }
  send() {
    FakeXhr.sent.push(this);
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
  progress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total });
  }
  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.onload?.();
  }
}

const realXhr = globalThis.XMLHttpRequest;
const sentCount = async (n: number) => {
  for (let i = 0; i < 50 && FakeXhr.sent.length < n; i++)
    await new Promise((r) => setTimeout(r, 0));
  expect(FakeXhr.sent).toHaveLength(n);
  return FakeXhr.sent[n - 1]!;
};

let token: string | null;
const refresh = jest.fn(async () => {
  token = 'fresh';
  return token;
});

beforeEach(() => {
  FakeXhr.sent = [];
  token = 'stale';
  refresh.mockClear();
  (globalThis as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest = FakeXhr;
  configureApi({ getAccessToken: () => token, refresh });
});
afterAll(() => {
  globalThis.XMLHttpRequest = realXhr;
});

describe('apiUploadWithProgress', () => {
  it('posts with the usual headers, reports whole percents and resolves with the body', async () => {
    const onProgress = jest.fn();
    const result = apiUploadWithProgress<{ key: string }>(
      '/owner/properties/media/upload',
      new FormData(),
      {
        onProgress,
      }
    );
    const xhr = await sentCount(1);
    expect(xhr.url).toMatch(/\/owner\/properties\/media\/upload$/);
    expect(xhr.headers).toMatchObject({
      Accept: 'application/json',
      'x-client-app': 'mobile',
      'x-device-id': 'install-1',
      Authorization: 'Bearer stale',
    });
    expect(xhr.headers['Content-Type']).toBeUndefined();
    xhr.progress(1, 3);
    xhr.progress(3, 3);
    expect(onProgress.mock.calls).toEqual([[33], [100]]);
    xhr.respond(201, { key: 'k1' });
    await expect(result).resolves.toEqual({ key: 'k1' });
  });

  it('turns an error answer into an ApiError with the server message', async () => {
    const result = apiUploadWithProgress('/x', new FormData());
    (await sentCount(1)).respond(413, { message: 'That photo is too large.' });
    await expect(result).rejects.toMatchObject({
      status: 413,
      message: 'That photo is too large.',
    });
    await expect(result).rejects.toBeInstanceOf(ApiError);
  });

  it('refreshes once on a 401 and sends again from 0', async () => {
    const onProgress = jest.fn();
    const result = apiUploadWithProgress<{ key: string }>('/x', new FormData(), { onProgress });
    const first = await sentCount(1);
    first.progress(10, 10);
    first.respond(401, { message: 'Unauthorized' });
    const second = await sentCount(2);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(second.headers.Authorization).toBe('Bearer fresh');
    expect(onProgress.mock.calls).toEqual([[100], [0]]);
    second.respond(200, { key: 'k2' });
    await expect(result).resolves.toEqual({ key: 'k2' });
  });

  it('rejects a cancel with an AbortError', async () => {
    const controller = new AbortController();
    const result = apiUploadWithProgress('/x', new FormData(), { signal: controller.signal });
    const xhr = await sentCount(1);
    controller.abort();
    expect(xhr.aborted).toBe(true);
    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('reports a dropped connection as a network error', async () => {
    const result = apiUploadWithProgress('/x', new FormData());
    (await sentCount(1)).onerror?.();
    await expect(result).rejects.toMatchObject({ status: 0, message: 'Network request failed.' });
  });
});
