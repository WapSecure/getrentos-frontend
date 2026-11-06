import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { LocateFixed, Navigation, Route } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { agentApi } from '@/lib/api/agent';
import { qk } from '@/lib/query/keys';

const TYPE_LABEL = {
  INSPECTION: 'Inspection',
  VERIFICATION: 'Verification',
  VALUATION: 'Valuation',
  DOCUMENT_PICKUP: 'Document pickup',
} as const;

/**
 * "Today's route" on the phone: the day's visits in a drivable order with
 * arrival times, starting from where the agent is if they share it, and a
 * button into Google Maps. Hidden when there is nothing to visit.
 */
export function RouteCard() {
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const [start, setStart] = useState<{ latitude: number; longitude: number } | undefined>();
  const [locating, setLocating] = useState(false);
  const q = useQuery({
    queryKey: qk.agent.route(start ? `${start.latitude},${start.longitude}` : 'default'),
    queryFn: () => agentApi.route(start),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const fromHere = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        toast.show('Location was not shared, so the route starts at your first visit.', 'info');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setStart({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      toast.show('Could not get your location.', 'error');
    } finally {
      setLocating(false);
    }
  };

  if (q.isLoading) return <Skeleton height={120} radius={radius.md} />;
  const d = q.data;
  if (!d || (d.stops.length === 0 && d.unplaced.length === 0)) return null;

  return (
    <Card elevated>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Route size={18} color={colors.primary} />
          <Text variant="bodyStrong" headingLevel={2}>
            Today&apos;s route
          </Text>
        </View>
        {d.stops.length ? (
          <Text variant="caption" color="mutedForeground">
            {d.stops.length} stop{d.stops.length === 1 ? '' : 's'} · {d.totalKm} km ·{' '}
            {d.totalDriveMinutes} min driving · done about {d.finish}
          </Text>
        ) : null}
        {d.stops.map((s, i) => (
          <View key={s.taskId} style={{ gap: 2 }}>
            {i > 0 ? <Divider /> : null}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                flexWrap: 'wrap',
              }}
            >
              <Text variant="label">
                {i + 1}. {s.title}
              </Text>
              <Badge label={TYPE_LABEL[s.type]} />
              {s.overdue ? <Badge label="Overdue" tone="danger" /> : null}
            </View>
            <Text variant="caption" color="mutedForeground">
              {s.address}
            </Text>
            <Text variant="caption" color={s.late ? 'destructive' : 'mutedForeground'}>
              Arrive about {s.arrive}
              {s.fixedAt ? ` (booked for ${s.fixedAt})` : ''} ·{' '}
              {i === 0 && s.distanceKm === 0
                ? 'first stop'
                : `${s.driveMinutes} min, ${s.distanceKm} km`}
              {s.late ? ' · likely late: tell the client' : ''}
            </Text>
          </View>
        ))}
        {d.unplaced.length ? (
          <Text variant="caption" color="mutedForeground">
            Not on the map yet: {d.unplaced.map((u) => u.title).join(', ')}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
          <Button
            label="Start from here"
            size="sm"
            variant="secondary"
            icon={<LocateFixed size={14} color={colors.foreground} />}
            loading={locating}
            onPress={() => void fromHere()}
          />
          {d.directionsUrl ? (
            <Button
              label="Open in Google Maps"
              size="sm"
              icon={<Navigation size={14} color={colors.primaryForeground} />}
              onPress={() => void Linking.openURL(d.directionsUrl!)}
            />
          ) : null}
        </View>
        <Text variant="caption" color="mutedForeground">
          {d.note}
        </Text>
      </View>
    </Card>
  );
}
