/**
 * `Alert.alert` for the web build.
 *
 * React Native's Alert has no web implementation, so every "Are you sure?" in
 * the app (charging dues, marking paid, declaring an emergency, signing out…)
 * rendered nothing and its action never ran. On web, `installWebAlert` points
 * `Alert.alert` at this queue, and `WebAlertHost` shows each entry as an in-app
 * dialog with the same buttons. Phones keep the native dialog: the 77 call
 * sites do not change.
 *
 * Kept free of React Native imports so the queue can be unit tested.
 */

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

/**
 * The buttons as a dialog shows them: an alert with none gets a single OK
 * (as on iOS and Android), and an unlabelled button reads OK.
 */
export function normaliseButtons(
  buttons?: WebAlertButton[]
): (WebAlertButton & { text: string })[] {
  const list = buttons?.length ? buttons : [{ text: 'OK' }];
  return list.map((b) => ({ ...b, text: b.text?.trim() ? b.text : 'OK' }));
}

/** Same signature as `Alert.alert`. Alerts raised together are shown one after another. */
export function showWebAlert(title: string, message?: string, buttons?: WebAlertButton[]): void {
  queue.push({ id: nextId++, title, message, buttons: normaliseButtons(buttons) });
  if (queue.length === 1) notify();
}

/**
 * Closes the dialog on screen, then runs the chosen button's action. The action
 * runs after the dialog has gone, so one that raises another alert (a second
 * confirmation, a result) is queued behind a closed dialog rather than lost.
 */
export function answerWebAlert(id: number, button?: WebAlertButton): void {
  if (queue[0]?.id !== id) return;
  queue.shift();
  notify();
  button?.onPress?.();
}

/**
 * What dismissing the dialog (Escape, tapping outside) means: the cancel
 * button, if there is one. Without one the dialog stays, as a native alert
 * with no cancel option cannot be waved away either.
 */
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

/** Test seam: forget everything queued. */
export function resetWebAlertsForTests(): void {
  queue.length = 0;
  nextId = 1;
  notify();
}
