'use client';

import { useState } from 'react';
import { PhoneCall, X, RotateCcw } from 'lucide-react';
import { ussdScreens, USSD_CODE } from '@/lib/ussdMenu';
import type { UssdSessionState } from '@/types/ussd';

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

export const UssdSimulator = () => {
  const [session, setSession] = useState<UssdSessionState>('idle');
  const [path, setPath] = useState('root');
  const [history, setHistory] = useState<string[]>([]);

  const currentScreen = ussdScreens[path];

  const handleDial = () => {
    setSession('active');
    setPath('root');
    setHistory([]);
  };

  const handleEnd = () => {
    setSession('ended');
  };

  const handleRestart = () => {
    setSession('idle');
    setPath('root');
    setHistory([]);
  };

  const handleKeyPress = (key: string) => {
    if (session !== 'active') return;

    if (key === '0') {
      if (history.length === 0) {
        handleEnd();
        return;
      }
      const previous = [...history];
      const last = previous.pop()!;
      setHistory(previous);
      setPath(last);
      return;
    }

    if (key === '*' || key === '#') return;

    const next = currentScreen?.options?.[key];
    if (next) {
      setHistory((prev) => [...prev, path]);
      setPath(next);
    }
  };

  const displayText = (() => {
    if (session === 'idle') return `Dial ${USSD_CODE} to begin`;
    if (session === 'ended') return 'Session ended.\n\nDial again to restart.';
    const hint = history.length > 0 ? '\n\n0 Back' : '\n\n0 End Session';
    return `${currentScreen.text}${hint}`;
  })();

  return (
    <div className="w-full max-w-[280px] mx-auto">
      <div className="rounded-[2rem] border-4 border-gray-800 dark:border-gray-700 bg-gray-900 p-3 shadow-xl">
        <div className="rounded-lg bg-[#c8d6b9] dark:bg-[#a8c090] p-3 min-h-[180px] flex flex-col">
          <div className="flex-1 font-mono text-[11px] leading-relaxed text-gray-900 whitespace-pre-wrap">
            {displayText}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {KEYPAD_ROWS.flat().map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              disabled={session !== 'active'}
              className="h-9 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {key}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          {session === 'idle' && (
            <button
              onClick={handleDial}
              className="flex-1 h-9 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Dial {USSD_CODE}
            </button>
          )}
          {session === 'active' && (
            <button
              onClick={handleEnd}
              className="flex-1 h-9 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              End Session
            </button>
          )}
          {session === 'ended' && (
            <button
              onClick={handleRestart}
              className="flex-1 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Dial Again
            </button>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-3">
        Simulated USSD session — no real airtime or phone required
      </p>
    </div>
  );
};
