'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button, Field, NumberInput, Skeleton, ToggleChip, useToast } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { agentKeys } from '@/lib/queryKeys';
import { AddressInput } from '@/components/shared/location/AddressInput';
import {
  AGENT_WORKING_DAYS,
  agentService,
  type AgentFieldPreferences,
  type AgentWorkingDay,
} from '@/services/agentService';

// Starting suggestions only; an agent can add any area they cover.
const SUGGESTED_AREAS = ['Victoria Island', 'Lekki', 'Ikoyi', 'Ikeja', 'Surulere', 'Yaba'];

const DAY_LABELS: Record<AgentWorkingDay, string> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
};

export const FieldPreferencesSettings = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [areas, setAreas] = useState<string[]>([]);
  const [days, setDays] = useState<AgentWorkingDay[]>([]);
  const [cap, setCap] = useState('');
  const [newArea, setNewArea] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: agentKeys.settingsFieldPreferences,
    queryFn: () => unwrap(agentService.getFieldPreferences()),
  });

  useEffect(() => {
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAreas(data.serviceAreas);
    setDays(data.workingDays);
    setCap(data.maxTasksPerDay ? String(data.maxTasksPerDay) : '');
  }, [data]);

  const save = useMutation({
    mutationFn: (prefs: AgentFieldPreferences) =>
      unwrap(agentService.updateFieldPreferences(prefs)),
    onSuccess: (saved) => {
      queryClient.setQueryData(agentKeys.settingsFieldPreferences, saved);
      toast.success('Field preferences saved.');
    },
    onError: (error) => toast.error(error.message || 'Unable to save your field preferences.'),
  });

  const areaOptions = [...SUGGESTED_AREAS, ...areas.filter((a) => !SUGGESTED_AREAS.includes(a))];
  const toggleArea = (area: string) =>
    setAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  const toggleDay = (day: AgentWorkingDay) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const trimmedArea = newArea.trim();
  /** Adds a typed area, or the area picked from the suggestions, then clears the box. */
  const addArea = (name = trimmedArea) => {
    const area = name.trim().slice(0, 60);
    if (area.length < 2) return;
    const existing = areaOptions.find((a) => a.toLowerCase() === area.toLowerCase());
    setAreas((prev) => (prev.includes(existing ?? area) ? prev : [...prev, existing ?? area]));
    setNewArea('');
  };

  const capNumber = cap.trim() === '' ? null : Number(cap);
  const capInvalid =
    capNumber !== null && (!Number.isInteger(capNumber) || capNumber < 1 || capNumber > 20);

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Field preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Where and when you take field work. Clients see these when they assign you a task, and tasks
        can&apos;t be booked on a day you don&apos;t work or beyond your daily limit.
      </p>

      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-40" />
        </div>
      ) : isError ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your field preferences.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <div>
              <p
                id="field-service-areas"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Service areas
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Leave all off if you cover anywhere.
              </p>
              <div
                role="group"
                aria-labelledby="field-service-areas"
                className="flex flex-wrap gap-2"
              >
                {areaOptions.map((area) => (
                  <ToggleChip
                    key={area}
                    pressed={areas.includes(area)}
                    onPressedChange={() => toggleArea(area)}
                  >
                    {area}
                  </ToggleChip>
                ))}
              </div>
              <form
                className="mt-3 flex max-w-md items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addArea();
                }}
              >
                <Field label="Add an area" className="flex-1">
                  <AddressInput
                    kind="area"
                    allowManual
                    value={newArea ? { text: newArea } : null}
                    placeholder="For example: Gbagada"
                    onChange={(next) =>
                      next?.verified ? addArea(next.verified.line1) : setNewArea(next?.text ?? '')
                    }
                  />
                </Field>
                <Button type="submit" variant="outline" disabled={trimmedArea.length < 2}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add
                </Button>
              </form>
            </div>

            <div>
              <p id="field-working-days" className="block text-sm font-medium text-foreground mb-1">
                Working days
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Leave all off if you work every day.
              </p>
              <div
                role="group"
                aria-labelledby="field-working-days"
                className="flex flex-wrap gap-2"
              >
                {AGENT_WORKING_DAYS.map((day) => (
                  <ToggleChip
                    key={day}
                    pressed={days.includes(day)}
                    onPressedChange={() => toggleDay(day)}
                  >
                    {DAY_LABELS[day]}
                  </ToggleChip>
                ))}
              </div>
            </div>

            <Field
              label="Most tasks due in one day"
              hint="Leave empty for no limit."
              error={capInvalid ? 'Enter a whole number from 1 to 20.' : undefined}
              className="max-w-xs"
            >
              <NumberInput min={1} max={20} value={cap} onValueChange={setCap} />
            </Field>
          </div>

          <Button
            variant="primary"
            className="mt-6"
            isLoading={save.isPending}
            disabled={capInvalid}
            onClick={() =>
              save.mutate({
                serviceAreas: areas,
                workingDays: AGENT_WORKING_DAYS.filter((d) => days.includes(d)),
                maxTasksPerDay: capNumber,
              })
            }
          >
            Save preferences
          </Button>
        </>
      )}
    </div>
  );
};
