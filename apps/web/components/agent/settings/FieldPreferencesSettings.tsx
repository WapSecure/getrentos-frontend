'use client';

import { useState } from 'react';
import { Field, NumberInput, SaveButton, Switch } from '@getrentos/ui';

const serviceAreaOptions = ['Victoria Island', 'Lekki', 'Ikoyi', 'Ikeja', 'Surulere', 'Yaba'];
const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const FieldPreferencesSettings = () => {
  const [serviceAreas, setServiceAreas] = useState<string[]>(['Ikeja', 'Surulere']);
  const [availableDays, setAvailableDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [maxDailyTasks, setMaxDailyTasks] = useState('4');
  const [syncOnCellular, setSyncOnCellular] = useState(false);

  const toggleArea = (area: string) => {
    setServiceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Field Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Availability and offline behavior for field work
      </p>

      <div className="space-y-4">
        <div>
          <p id="field-service-areas" className="block text-sm font-medium text-foreground mb-2">
            Service Areas
          </p>
          <div role="group" aria-labelledby="field-service-areas" className="flex flex-wrap gap-2">
            {serviceAreaOptions.map((area) => (
              <button
                key={area}
                type="button"
                aria-pressed={serviceAreas.includes(area)}
                onClick={() => toggleArea(area)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  serviceAreas.includes(area)
                    ? 'border-primary bg-accent text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p id="field-available-days" className="block text-sm font-medium text-foreground mb-2">
            Available Days
          </p>
          <div role="group" aria-labelledby="field-available-days" className="flex flex-wrap gap-2">
            {dayOptions.map((day) => (
              <button
                key={day}
                type="button"
                aria-pressed={availableDays.includes(day)}
                onClick={() => toggleDay(day)}
                className={`w-11 h-9 rounded-lg text-sm border transition-colors ${
                  availableDays.includes(day)
                    ? 'border-primary bg-accent text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <Field label="Max Tasks Per Day">
          <NumberInput min={1} max={20} value={maxDailyTasks} onValueChange={setMaxDailyTasks} />
        </Field>

        <Switch
          checked={syncOnCellular}
          onCheckedChange={setSyncOnCellular}
          label="Sync photos over cellular data"
          description="By default, large inspection photos wait for Wi-Fi to sync and save your data"
          className="p-3 rounded-lg border border-border"
        />
      </div>

      <SaveButton label="Save Preferences" className="mt-6" />
    </div>
  );
};
