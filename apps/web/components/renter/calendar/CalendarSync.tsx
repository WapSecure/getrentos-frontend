'use client';

import { useState } from 'react';
import { Calendar, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Field, RadioGroup, Switch } from '@getrentos/ui';

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
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/12"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Calendar Sync</h3>
            <p className="text-xs text-muted-foreground">Sync with external calendars</p>
          </div>
        </div>
        <span aria-hidden="true" className="p-1 text-muted-foreground">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          <Switch
            checked={syncEnabled}
            onCheckedChange={setSyncEnabled}
            label="Sync Calendar"
            size="sm"
          />

          {syncEnabled && (
            <>
              <Field label="Select Calendar Service">
                <RadioGroup
                  variant="card"
                  value={syncProvider}
                  onValueChange={setSyncProvider}
                  options={providers.map((provider) => ({
                    value: provider.id,
                    label: provider.name,
                    icon: provider.icon,
                  }))}
                />
              </Field>

              <Button variant="primary" size="sm" fullWidth icon={<Check className="w-4 h-4" />}>
                Connect {providers.find((p) => p.id === syncProvider)?.name}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
