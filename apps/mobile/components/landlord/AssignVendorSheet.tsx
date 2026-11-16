import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HardHat } from '@sureground/icons/native';
import {
  Badge,
  Button,
  DateField,
  QueryState,
  Skeleton,
  Text,
  TimeField,
  toISODate,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { landlordApi, type LandlordMaintenance } from '@/lib/api/landlord';
import { errorMessage } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  request: LandlordMaintenance | null;
}

export function AssignVendorSheet({ open, onClose, request }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Assign a vendor">
      {request ? (
        <AssignVendorBody request={request} onClose={onClose} onSubmittingChange={setSubmitting} />
      ) : null}
    </Sheet>
  );
}

function AssignVendorBody({
  request,
  onClose,
  onSubmittingChange,
}: {
  request: LandlordMaintenance;
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const vendors = useQuery({
    queryKey: qk.landlord.vendors(),
    queryFn: () => landlordApi.vendors(),
  });

  // Optional visit; both parts are needed. Lagos is UTC+1 all year, matching the web's visit time.
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const visitIso =
    visitDate && visitTime ? new Date(`${visitDate}T${visitTime}:00+01:00`).toISOString() : undefined;

  const assign = useMutation({
    mutationFn: (vendorId: string) => landlordApi.assignVendor(request.id, vendorId, visitIso),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'maintenance'] });
      toast.show(visitIso ? 'Vendor assigned and visit booked.' : 'Vendor assigned.', 'success');
      onClose();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not assign that vendor.'), 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  const items = vendors.data?.items ?? [];

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Who should handle <Text variant="bodyStrong">{request.issueTitle}</Text>?
      </Text>

      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground">
          Visit (optional): the tenant is told when to expect them
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <DateField
            label="Date"
            value={visitDate}
            onChange={setVisitDate}
            min={toISODate(new Date())}
            containerStyle={{ flex: 1 }}
          />
          <TimeField label="Time" value={visitTime} onChange={setVisitTime} containerStyle={{ flex: 1 }} />
        </View>
        {visitDate && !visitTime ? (
          <Text variant="caption" color="mutedForeground">
            Pick a time too, or the visit will not be booked.
          </Text>
        ) : null}
      </View>

      <QueryState
        query={vendors}
        skeleton={
          <View style={{ gap: spacing.sm }}>
            {[0, 1].map((i) => (
              <Skeleton key={i} height={56} radius={radius.md} />
            ))}
          </View>
        }
        isEmpty={items.length === 0}
        empty={{
          icon: <HardHat size={28} color={colors.mutedForeground} />,
          title: 'No vendors yet',
          description: 'Add a tradesperson to your list first.',
          action: (
            <Button
              label="Add a vendor"
              size="sm"
              onPress={() => {
                onClose();
                router.push('/(app)/landlord-vendors');
              }}
            />
          ),
        }}
      >
        <View style={{ gap: spacing.sm }}>
          {items.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => assign.mutate(v.id)}
              disabled={assign.isPending}
              accessibilityRole="button"
              accessibilityLabel={`Assign ${v.name}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.lg,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: assign.isPending ? 0.5 : 1,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {v.name}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  {v.jobsCompleted} job{v.jobsCompleted === 1 ? '' : 's'} completed
                </Text>
              </View>
              <Badge label={v.serviceType} tone="neutral" />
            </Pressable>
          ))}
        </View>
      </QueryState>
    </View>
  );
}
