/**
 * File parts for uploads made from the web build.
 *
 * React Native's `fetch` uploads a `{ uri, name, type }` object as a file. A
 * browser's FormData does not: it turns the object into the text
 * "[object Object]", so the server got a text field called `file` and refused
 * it ("property file should not exist"). On the web, `appendFile` queues the
 * file here instead, and `apiUpload` reads each picked file's blob:/data: URI
 * into a real File just before sending.
 */
interface QueuedFile {
  field: string;
  uri: string;
  name: string;
  type: string;
}

const queued = new WeakMap<FormData, QueuedFile[]>();

export function queueWebFile(form: FormData, file: QueuedFile): void {
  queued.set(form, [...(queued.get(form) ?? []), file]);
}

/** Appends every queued file to the form as a real File. Safe to call more than once. */
export async function attachQueuedWebFiles(form: FormData): Promise<void> {
  const files = queued.get(form);
  if (!files) return;
  queued.delete(form);
  for (const f of files) {
    const blob = await (await fetch(f.uri)).blob();
    form.append(f.field, new File([blob], f.name, { type: f.type || blob.type }));
  }
}
