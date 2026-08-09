'use client';

import { useState } from 'react';
import { Wifi } from 'lucide-react';
import { SaveButton } from '@/components/ui/SaveButton';

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
          <label className="block text-sm font-medium text-foreground mb-2">Service Areas</label>
          <div className="flex flex-wrap gap-2">
            {serviceAreaOptions.map((area) => (
              <button
                key={area}
                type="button"
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
          <label className="block text-sm font-medium text-foreground mb-2">Available Days</label>
          <div className="flex flex-wrap gap-2">
            {dayOptions.map((day) => (
              <button
                key={day}
                type="button"
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

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Max Tasks Per Day
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={maxDailyTasks}
            onChange={(e) => setMaxDailyTasks(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <label className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer">
          <div className="flex items-start gap-3">
            <Wifi className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-foreground">Sync photos over cellular data</p>
              <p className="text-xs text-gray-400 mt-0.5">
                By default, large inspection photos wait for Wi-Fi to sync and save your data
              </p>
            </div>
          </div>
          <Toggle checked={syncOnCellular} onChange={() => setSyncOnCellular((v) => !v)} />
        </label>
      </div>

      <SaveButton label="Save Preferences" className="mt-6" />
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
      checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);
