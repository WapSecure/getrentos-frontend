import { useCallback, useEffect, useState } from 'react';

/**
 * A seconds countdown for "Resend code in 42s". Driven by a deadline rather
 * than decrementing state, so a backgrounded app (where intervals pause)
 * still shows the right number when it comes back.
 */
export function useCountdown(initialSeconds = 0) {
  const [deadline, setDeadline] = useState<number | null>(() =>
    initialSeconds > 0 ? Date.now() + initialSeconds * 1000 : null
  );
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) setDeadline(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const start = useCallback((seconds: number) => {
    setRemaining(seconds);
    setDeadline(Date.now() + seconds * 1000);
  }, []);

  return { remaining, running: remaining > 0, start };
}
