'use client';

import { useState } from 'react';
import { Calendar, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@getrentos/ui';

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
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Calendar Sync</h3>
            <p className="text-xs text-muted-foreground">Sync with external calendars</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Sync Calendar</span>
            <button
              onClick={() => setSyncEnabled(!syncEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                syncEnabled ? 'bg-primary' : 'bg-border'
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
                <label className="block text-xs font-medium text-foreground mb-1">
                  Select Calendar Service
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSyncProvider(provider.id)}
                      className={`p-2 rounded-lg text-center border transition-colors ${
                        syncProvider === provider.id
                          ? 'border-primary bg-accent'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="text-2xl">{provider.icon}</div>
                      <p className="text-xs text-muted-foreground mt-1">{provider.name}</p>
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
