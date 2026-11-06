'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, LocateFixed, MapPin, Navigation, Route } from 'lucide-react';
import { Badge, Button, Card, Skeleton } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';

const TYPE_LABEL = {
  INSPECTION: 'Inspection',
  VERIFICATION: 'Verification',
  VALUATION: 'Valuation',
  DOCUMENT_PICKUP: 'Document pickup',
} as const;

/**
 * "Today's route": the agent's visits for today (and anything overdue) in a
 * drivable order, booked inspections kept, with arrival times and a Google
 * Maps link. Hidden when there is nothing to visit.
 */
export function TodaysRoute() {
  const [start, setStart] = useState<{ latitude: number; longitude: number } | undefined>();
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: agentKeys.route(start ? `${start.latitude},${start.longitude}` : 'default'),
    queryFn: () => unwrap(agentService.getRoute(start)),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const startFromMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError('This browser cannot share your location.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setLocError(null);
        setStart({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setLocError('Location was not shared, so the route starts at your first visit.');
      },
      { timeout: 10_000 }
    );
  };

  if (isLoading) {
    return (
      <Card static className="space-y-2 p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }
  if (!data || (data.stops.length === 0 && data.unplaced.length === 0)) return null;

  return (
    <Card static className="space-y-4 p-5" aria-labelledby="todays-route-title">
      <div className="flex flex-wrap items-center gap-2">
        <Route className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="todays-route-title" className="text-sm font-semibold text-foreground">
          Today&apos;s route
        </h2>
        {data.stops.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {data.stops.length} stop{data.stops.length === 1 ? '' : 's'} · {data.totalKm} km ·{' '}
            {data.totalDriveMinutes} min driving · done about {data.finish}
          </span>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={<LocateFixed className="h-4 w-4" aria-hidden />}
            isLoading={locating}
            loadingText="Locating…"
            onClick={startFromMyLocation}
          >
            Start from my location
          </Button>
          {data.directionsUrl && (
            <Button
              size="sm"
              variant="outline"
              icon={<Navigation className="h-4 w-4" aria-hidden />}
              onClick={() => window.open(data.directionsUrl!, '_blank', 'noopener,noreferrer')}
            >
              Open in Google Maps
            </Button>
          )}
        </div>
      </div>
      {locError && <p className="text-xs text-muted-foreground">{locError}</p>}

      {data.stops.length > 0 && (
        <ol className="space-y-2">
          {data.stops.map((s, i) => (
            <li key={s.taskId} className="flex gap-3 rounded-lg border border-border p-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{s.title}</p>
                  <Badge variant="neutral">{TYPE_LABEL[s.type]}</Badge>
                  {s.overdue && <Badge variant="danger">Overdue</Badge>}
                  {s.priority === 'HIGH' && !s.overdue && <Badge variant="warning">High</Badge>}
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {s.address}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" aria-hidden />
                  Arrive about {s.arrive}
                  {s.fixedAt && ` (booked for ${s.fixedAt})`} ·{' '}
                  {i === 0 && s.distanceKm === 0
                    ? 'first stop'
                    : `${s.driveMinutes} min, ${s.distanceKm} km`}
                  {s.late && (
                    <span className="text-destructive"> · likely late: tell the client</span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {data.unplaced.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Not on the map yet</p>
          <ul className="mt-0.5 space-y-0.5">
            {data.unplaced.map((u) => (
              <li key={u.taskId}>
                {u.title}: {u.address}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">{data.note}</p>
    </Card>
  );
}
