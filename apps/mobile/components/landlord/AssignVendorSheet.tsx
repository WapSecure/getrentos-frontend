import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HardHat } from 'lucide-react-native';
import {
  Badge,
  Button,
  EmptyState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { landlordApi, type LandlordMaintenance } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  request: LandlordMaintenance | null;
}

export function AssignVendorSheet({ open, onClose, request }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Assign a vendor">
      {request ? <AssignVendorBody request={request} onClose={onClose} /> : null}
    </Sheet>
  );
}

function AssignVendorBody({
  request,
  onClose,
}: {
  request: LandlordMaintenance;
  onClose: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const vendors = useQuery({
    queryKey: qk.landlord.vendors(),
    queryFn: () => landlordApi.vendors(),
  });

  const assign = useMutation({
    mutationFn: (vendorId: string) => landlordApi.assignVendor(request.id, vendorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'maintenance'] });
      toast.show('Vendor assigned.', 'success');
      onClose();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not assign that vendor.', 'error'),
  });

  const items = vendors.data?.items ?? [];

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Who should handle <Text variant="bodyStrong">{request.issueTitle}</Text>?
      </Text>

      {vendors.isLoading ? (
        <View style={{ gap: spacing.sm }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={56} radius={radius.md} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<HardHat size={28} color={colors.mutedForeground} />}
          title="No vendors yet"
          description="Add a tradesperson to your list first."
          action={
            <Button
              label="Add a vendor"
              size="sm"
              onPress={() => {
                onClose();
                router.push('/(app)/landlord-vendors');
              }}
            />
          }
        />
      ) : (
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
      )}
    </View>
  );
}
