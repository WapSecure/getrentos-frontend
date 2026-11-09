// React Native's Alert has no web implementation; installWebAlert points it at this queue.
// Free of React Native imports so it can be unit tested.

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface WebAlertButton {
  text?: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
}

export interface WebAlertEntry {
  id: number;
  title: string;
  message?: string;
  buttons: (WebAlertButton & { text: string })[];
}

type Listener = (current: WebAlertEntry | null) => void;

let nextId = 1;
const queue: WebAlertEntry[] = [];
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l(queue[0] ?? null));

export function normaliseButtons(
  buttons?: WebAlertButton[]
): (WebAlertButton & { text: string })[] {
  const list = buttons?.length ? buttons : [{ text: 'OK' }];
  return list.map((b) => ({ ...b, text: b.text?.trim() ? b.text : 'OK' }));
}

export function showWebAlert(title: string, message?: string, buttons?: WebAlertButton[]): void {
  queue.push({ id: nextId++, title, message, buttons: normaliseButtons(buttons) });
  if (queue.length === 1) notify();
}

// The action runs after the dialog closes, so an alert it raises is queued rather than lost.
export function answerWebAlert(id: number, button?: WebAlertButton): void {
  if (queue[0]?.id !== id) return;
  queue.shift();
  notify();
  button?.onPress?.();
}

// Without a cancel button the dialog stays, as a native alert would.
export function cancelButton(entry: WebAlertEntry): WebAlertButton | undefined {
  return entry.buttons.find((b) => b.style === 'cancel');
}

export function subscribeWebAlert(listener: Listener): () => void {
  listeners.add(listener);
  listener(queue[0] ?? null);
  return () => {
    listeners.delete(listener);
  };
}

export function resetWebAlertsForTests(): void {
  queue.length = 0;
  nextId = 1;
  notify();
}
