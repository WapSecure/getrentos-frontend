/** A browser's FormData sends a `{ uri, name, type }` object as "[object Object]", so on web files are queued here and read into real Files before sending. */
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

/** Safe to call more than once. */
export async function attachQueuedWebFiles(form: FormData): Promise<void> {
  const files = queued.get(form);
  if (!files) return;
  queued.delete(form);
  for (const f of files) {
    const blob = await (await fetch(f.uri)).blob();
    form.append(f.field, new File([blob], f.name, { type: f.type || blob.type }));
  }
}
