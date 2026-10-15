import { attachQueuedWebFiles, queueWebFile } from '@/lib/api/webFormFiles';

describe('web upload file parts', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('attaches a queued picker file as a real File, once', async () => {
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    globalThis.fetch = jest.fn().mockResolvedValue({ blob: () => Promise.resolve(blob) }) as never;

    const form = new FormData();
    form.append('name', 'Government ID');
    queueWebFile(form, {
      field: 'file',
      uri: 'blob:http://localhost/abc',
      name: 'id.pdf',
      type: 'application/pdf',
    });
    // Not attached yet: a browser would otherwise send "[object Object]".
    expect(form.get('file')).toBeNull();

    await attachQueuedWebFiles(form);
    const part = form.get('file') as File;
    expect(part).toBeInstanceOf(File);
    expect(part.name).toBe('id.pdf');
    expect(part.type).toBe('application/pdf');

    // A retried upload (after a token refresh) must not attach it twice.
    await attachQueuedWebFiles(form);
    expect(form.getAll('file')).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('leaves a form with nothing queued alone', async () => {
    const form = new FormData();
    await attachQueuedWebFiles(form);
    expect(form.get('file')).toBeNull();
  });
});
