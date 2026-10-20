'use client';

import { useState } from 'react';
import { Moon, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, Card, Field, Switch, TimePicker } from '@getrentos/ui';

export const DoNotDisturb = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('07:00');
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Do Not Disturb</h3>
            <p className="text-xs text-muted-foreground">
              Silence notifications during quiet hours
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          <Switch
            label="Quiet Hours"
            description="Mute notifications during these hours"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />

          {isEnabled && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Start Time">
                <TimePicker value={startTime} onChange={setStartTime} />
              </Field>
              <Field label="End Time">
                <TimePicker value={endTime} onChange={setEndTime} />
              </Field>
            </div>
          )}

          {isEnabled && (
            <Alert variant="info" icon={Clock}>
              Notifications will be silenced from {startTime} to {endTime}
            </Alert>
          )}
        </div>
      )}
    </Card>
  );
};
