import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, ChevronLeft, Images, Plus, Wrench, X } from 'lucide-react-native';
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  Chip,
  EmptyState,
  Screen,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { capturePhoto, pickPhoto } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import {
  residentApi,
  type MaintenanceTicketCategory,
  type MaintenanceTicketPriority,
  type MaintenanceTicketStatus,
} from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';

const CATEGORY_LABEL: Record<MaintenanceTicketCategory, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  structural: 'Structural',
  common_area: 'Common area',
  other: 'Other',
};

const PRIORITY_LABEL: Record<MaintenanceTicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const STATUS_LABEL: Record<MaintenanceTicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const STATUS_TONE: Record<MaintenanceTicketStatus, BadgeTone> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  dismissed: 'neutral',
};

function BackHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.md,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={10}
      >
        <ChevronLeft size={24} color={colors.foreground} />
      </Pressable>
      <Text variant="title" style={{ flex: 1 }}>
        {title}
      </Text>
      {action}
    </View>
  );
}

export default function ResidentMaintenance() {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [reportOpen, setReportOpen] = useState(false);

  const query = useQuery({
    queryKey: qk.resident.maintenance,
    queryFn: () => residentApi.listMaintenanceTickets(),
  });

  const report = useMutation({
    mutationFn: (data: {
      description: string;
      category?: MaintenanceTicketCategory;
      priority?: MaintenanceTicketPriority;
      photo?: PickedFile;
    }) => residentApi.reportMaintenanceTicket(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.resident.maintenance });
      setReportOpen(false);
    },
    onError: () => toast.show("Couldn't submit that report. Try again.", 'error'),
  });

  const tickets = query.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader
        title="Maintenance"
        action={
          <Pressable
            onPress={() => setReportOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Report an issue"
            hitSlop={10}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.accent,
            }}
          >
            <Plus size={18} color={colors.primary} />
          </Pressable>
        }
      />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={100} radius={16} />
            <Skeleton height={100} radius={16} />
          </View>
        ) : tickets.length > 0 ? (
          tickets.map((t) => (
            <Card key={t.id} elevated>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {t.photoUrl ? (
                  <Image
                    source={{ uri: t.photoUrl }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radius.md,
                      backgroundColor: colors.secondary,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radius.md,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Wrench size={22} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text variant="bodyStrong">{CATEGORY_LABEL[t.category]}</Text>
                    <Badge label={STATUS_LABEL[t.status]} tone={STATUS_TONE[t.status]} />
                  </View>
                  <Text variant="caption" color="mutedForeground" numberOfLines={2}>
                    {t.description}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    {PRIORITY_LABEL[t.priority]} priority · {formatDate(t.createdAt, 'short')}
                  </Text>
                </View>
              </View>
              {t.resolutionNotes ? (
                <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
                  Resolution: {t.resolutionNotes}
                </Text>
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState
            icon={<Wrench size={34} color={colors.mutedForeground} />}
            title="No maintenance tickets"
            description="Report an issue and your estate manager will be notified."
            action={<Button label="Report Issue" onPress={() => setReportOpen(true)} />}
          />
        )}
      </Screen>

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={(d) => report.mutate(d)}
        submitting={report.isPending}
      />
    </View>
  );
}

function ReportSheet({
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    description: string;
    category?: MaintenanceTicketCategory;
    priority?: MaintenanceTicketPriority;
    photo?: PickedFile;
  }) => void;
  submitting: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Report an Issue">
      <ReportForm key={open ? 'open' : 'closed'} onSubmit={onSubmit} submitting={submitting} />
    </Sheet>
  );
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as MaintenanceTicketCategory[];
const PRIORITIES = Object.keys(PRIORITY_LABEL) as MaintenanceTicketPriority[];

function ReportForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (data: {
    description: string;
    category?: MaintenanceTicketCategory;
    priority?: MaintenanceTicketPriority;
    photo?: PickedFile;
  }) => void;
  submitting: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MaintenanceTicketCategory | undefined>(undefined);
  const [priority, setPriority] = useState<MaintenanceTicketPriority | undefined>(undefined);
  const [photo, setPhoto] = useState<PickedFile | null>(null);

  const canSubmit = description.trim().length > 0;

  return (
    <View style={{ gap: spacing.lg }}>
      <Field label="What's wrong?">
        <TextField
          placeholder="Describe the issue"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </Field>
      <Field label="Category (optional)">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={CATEGORY_LABEL[c]}
              selected={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </View>
      </Field>
      <Field label="Priority (optional)">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {PRIORITIES.map((p) => (
            <Chip
              key={p}
              label={PRIORITY_LABEL[p]}
              selected={priority === p}
              onPress={() => setPriority(p)}
            />
          ))}
        </View>
      </Field>
      <Field label="Photo (optional)">
        {photo ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Image
              source={{ uri: photo.uri }}
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.md,
                backgroundColor: colors.secondary,
              }}
            />
            <Pressable
              onPress={() => setPhoto(null)}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.secondary,
              }}
            >
              <X size={16} color={colors.foreground} />
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Take Photo"
              variant="outline"
              size="sm"
              fullWidth={false}
              icon={<Camera size={16} color={colors.foreground} />}
              onPress={async () => setPhoto(await capturePhoto())}
            />
            <Button
              label="Choose Photo"
              variant="outline"
              size="sm"
              fullWidth={false}
              icon={<Images size={16} color={colors.foreground} />}
              onPress={async () => setPhoto(await pickPhoto())}
            />
          </View>
        )}
      </Field>
      <Button
        label={submitting ? 'Submitting…' : 'Submit Report'}
        disabled={!canSubmit}
        loading={submitting}
        fullWidth
        onPress={() =>
          onSubmit({
            description: description.trim(),
            category,
            priority,
            photo: photo ?? undefined,
          })
        }
      />
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}
