import {
  answerWebAlert,
  cancelButton,
  normaliseButtons,
  resetWebAlertsForTests,
  showWebAlert,
  subscribeWebAlert,
  type WebAlertEntry,
} from '@/lib/webAlert';

describe('web alerts', () => {
  let current: WebAlertEntry | null = null;
  let unsubscribe: () => void;

  beforeEach(() => {
    resetWebAlertsForTests();
    unsubscribe = subscribeWebAlert((e) => {
      current = e;
    });
  });
  afterEach(() => unsubscribe());

  it('shows a confirmation and runs the chosen action, only once it is chosen', () => {
    const charge = jest.fn();
    showWebAlert('Charge ₦25,000 to 1 household?', '₦25,000 in total.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Charge', onPress: charge },
    ]);
    expect(current?.title).toBe('Charge ₦25,000 to 1 household?');
    expect(charge).not.toHaveBeenCalled();

    answerWebAlert(current!.id, current!.buttons[1]);
    expect(charge).toHaveBeenCalledTimes(1);
    expect(current).toBeNull();
  });

  it('runs nothing when cancelled', () => {
    const remove = jest.fn();
    showWebAlert('Remove?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: remove },
    ]);
    answerWebAlert(current!.id, cancelButton(current!));
    expect(remove).not.toHaveBeenCalled();
    expect(current).toBeNull();
  });

  it('offers every choice of a multi-choice alert', () => {
    showWebAlert('Ada Obi', 'Block A', [
      { text: 'Needs help', style: 'destructive' },
      { text: 'Not on site' },
      { text: 'Not yet accounted for' },
      { text: 'Cancel', style: 'cancel' },
    ]);
    expect(current?.buttons.map((b) => b.text)).toEqual([
      'Needs help',
      'Not on site',
      'Not yet accounted for',
      'Cancel',
    ]);
  });

  it('gives an alert with no buttons a single OK, like the native one', () => {
    expect(normaliseButtons()).toEqual([{ text: 'OK' }]);
    expect(normaliseButtons([{ text: '' }])[0].text).toBe('OK');
  });

  it('cannot be waved away when it has no cancel button', () => {
    showWebAlert('Payment received', undefined, [{ text: 'OK' }]);
    expect(cancelButton(current!)).toBeUndefined();
  });

  it('shows alerts raised together one after another, and an alert raised by an action after it', () => {
    const second = jest.fn();
    showWebAlert('First', undefined, [
      {
        text: 'Next',
        onPress: () => showWebAlert('Raised by the action', undefined, [{ text: 'OK' }]),
      },
    ]);
    showWebAlert('Second', undefined, [{ text: 'OK', onPress: second }]);
    expect(current?.title).toBe('First');

    answerWebAlert(current!.id, current!.buttons[0]);
    expect(current?.title).toBe('Second');
    answerWebAlert(current!.id, current!.buttons[0]);
    expect(second).toHaveBeenCalled();
    expect(current?.title).toBe('Raised by the action');
  });

  it('ignores a stale answer for a dialog no longer on screen', () => {
    const act = jest.fn();
    showWebAlert('One', undefined, [{ text: 'Go', onPress: act }]);
    const stale = current!.id;
    answerWebAlert(stale, current!.buttons[0]);
    answerWebAlert(stale, { text: 'Go', onPress: act });
    expect(act).toHaveBeenCalledTimes(1);
  });
});
