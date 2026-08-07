'use client';

import { useState } from 'react';
import { Calendar, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const CalendarSync = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncProvider, setSyncProvider] = useState('google');

  const providers = [
    { id: 'google', name: 'Google Calendar', icon: '🔵' },
    { id: 'apple', name: 'Apple Calendar', icon: '🔴' },
    { id: 'outlook', name: 'Outlook Calendar', icon: '🟣' },
  ];

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#c4a747]" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">Calendar Sync</h3>
            <p className="text-xs text-gray-500">Sync with external calendars</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Sync Calendar</span>
            <button
              onClick={() => setSyncEnabled(!syncEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                syncEnabled ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  syncEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {syncEnabled && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Calendar Service
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSyncProvider(provider.id)}
                      className={`p-2 rounded-lg text-center border transition-colors ${
                        syncProvider === provider.id
                          ? 'border-[#c4a747] bg-[#c4a747]/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl">{provider.icon}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {provider.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="primary" size="sm" fullWidth>
                <Check className="w-4 h-4" />
                Connect {providers.find((p) => p.id === syncProvider)?.name}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
