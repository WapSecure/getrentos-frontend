/**
 * The short single-purpose forms: opening an eviction case, uploading a
 * document, generating an owner statement and setting a management fee.
 * Each is a few fields, so they share a module rather than one file apiece.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react-native';
import {
  Button,
  DateField,
  Skeleton,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABEL,
  type DocumentCategory,
  type ManagementFeeType,
} from '@/lib/api/landlord';
import type { PickedFile } from '@/lib/api/documents';
import { ApiError } from '@/lib/api/client';
import { pickDocument } from '@/lib/filePicker';

const fail = (toast: ReturnType<typeof useToast>, e: unknown, fallback: string) =>
  toast.show(e instanceof ApiError ? e.message : fallback, 'error');

/* ------------------------------ eviction ------------------------------- */

export function OpenEvictionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Open an eviction case">
      <OpenEvictionForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function OpenEvictionForm({ onClose }: { onClose: () => void }) {
  const { spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const leases = useQuery({ queryKey: qk.landlord.leases(), queryFn: () => landlordApi.leases() });
  // Only a lease someone is living under can be the subject of an eviction.
  const eligible = (leases.data?.items ?? []).filter(
    (l) => l.status === 'active' || l.status === 'signed'
  );

  const [leaseId, setLeaseId] = useState<string | undefined>();
  const [reason, setReason] = useState('');

  const start = useMutation({
    mutationFn: () => landlordApi.initiateEviction(leaseId!, reason.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'evictions'] });
      toast.show('Case opened. Issue a notice when you are ready.', 'success');
      onClose();
    },
    onError: (e) => fail(toast, e, 'Could not open that case.'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        This starts a tracked case. Nothing reaches the tenant until you issue a notice.
      </Text>
      {leases.isLoading ? (
        <Skeleton height={40} radius={radius.md} />
      ) : (
        <ChipSelect
          label="Tenancy"
          options={eligible.map((l) => ({
            value: l.id,
            label: `${l.tenantName} · ${l.propertyName}`,
          }))}
          value={leaseId}
          onChange={setLeaseId}
          emptyText="No active tenancies."
        />
      )}
      <TextField
        label="Reason"
        placeholder="e.g. Rent unpaid for three months"
        multiline
        numberOfLines={3}
        value={reason}
        onChangeText={setReason}
      />
      <Button
        label="Open case"
        variant="destructive"
        loading={start.isPending}
        disabled={!leaseId || !reason.trim()}
        onPress={() => start.mutate()}
      />
    </View>
  );
}

/* ------------------------------ document ------------------------------- */

export function UploadDocumentSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Upload a document">
      <UploadDocumentForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function UploadDocumentForm({ onClose }: { onClose: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('lease_agreements');

  const choose = async () => {
    const picked = await pickDocument();
    if (!picked) return;
    setFile(picked);
    // Default the name from the file, minus its extension.
    if (!name) setName(picked.name.replace(/\.[^.]+$/, ''));
  };

  const upload = useMutation({
    mutationFn: () => landlordApi.uploadDocument(file!, name.trim(), category),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'documents'] });
      toast.show('Document uploaded.', 'success');
      onClose();
    },
    onError: (e) => fail(toast, e, 'Could not upload that document.'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Button
        label={file ? 'Choose a different file' : 'Choose a file'}
        variant="outline"
        onPress={choose}
        icon={<FileText size={16} color={colors.primary} />}
      />
      {file ? (
        <View
          style={{
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.secondary,
          }}
        >
          <Text variant="caption" numberOfLines={1}>
            {file.name}
          </Text>
        </View>
      ) : null}
      <TextField label="Name" value={name} onChangeText={setName} />
      <ChipSelect
        label="Category"
        options={DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: DOCUMENT_CATEGORY_LABEL[c] }))}
        value={category}
        onChange={setCategory}
      />
      <Button
        label="Upload"
        loading={upload.isPending}
        disabled={!file || !name.trim()}
        onPress={() => upload.mutate()}
      />
    </View>
  );
}

/* --------------------------- owner statement --------------------------- */

export function GenerateStatementSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Generate a statement">
      <GenerateStatementForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function GenerateStatementForm({ onClose }: { onClose: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  // Default to last calendar month, the period people most often close.
  const now = new Date();
  const [periodStart, setPeriodStart] = useState(
    toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  );
  const [periodEnd, setPeriodEnd] = useState(
    toISODate(new Date(now.getFullYear(), now.getMonth(), 0))
  );

  const generate = useMutation({
    mutationFn: () => landlordApi.generateOwnerStatement({ periodStart, periodEnd }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'owner-statements'] });
      toast.show('Statement generated as a draft.', 'success');
      onClose();
    },
    onError: (e) => fail(toast, e, 'Could not generate that statement.'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <DateField label="From" value={periodStart} onChange={setPeriodStart} />
        </View>
        <View style={{ flex: 1 }}>
          <DateField label="To" value={periodEnd} onChange={setPeriodEnd} min={periodStart} />
        </View>
      </View>
      <Button
        label="Generate"
        loading={generate.isPending}
        disabled={!periodStart || periodEnd < periodStart}
        onPress={() => generate.mutate()}
      />
    </View>
  );
}

/* --------------------------- management fee ---------------------------- */

export function ManagementFeeSheet({
  open,
  onClose,
  propertyId,
}: {
  open: boolean;
  onClose: () => void;
  propertyId: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Management fee">
      {open ? <ManagementFeeForm propertyId={propertyId} onClose={onClose} /> : null}
    </Sheet>
  );
}

function ManagementFeeForm({ propertyId, onClose }: { propertyId: string; onClose: () => void }) {
  const { spacing, radius } = useTheme();
  const current = useQuery({
    queryKey: ['landlord', 'management-fee', propertyId],
    queryFn: () => landlordApi.managementFeeConfig(propertyId),
  });

  if (current.isLoading) return <Skeleton height={160} radius={radius.lg} />;
  return (
    <ManagementFeeFields
      propertyId={propertyId}
      initialType={current.data?.type ?? 'PERCENTAGE'}
      initialValue={current.data ? String(current.data.value) : ''}
      onClose={onClose}
      spacing={spacing.lg}
    />
  );
}

/** Mounted once the current config is known, so it seeds from props. */
function ManagementFeeFields({
  propertyId,
  initialType,
  initialValue,
  onClose,
  spacing,
}: {
  propertyId: string;
  initialType: ManagementFeeType;
  initialValue: string;
  onClose: () => void;
  spacing: number;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [type, setType] = useState<ManagementFeeType>(initialType);
  const [value, setValue] = useState(initialValue);

  const n = Number(value);
  const valid = value !== '' && n >= 0 && (type === 'FLAT' || n <= 100);

  const save = useMutation({
    mutationFn: () => landlordApi.setManagementFeeConfig({ propertyId, type, value: n }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'management-fee', propertyId] });
      toast.show('Management fee saved.', 'success');
      onClose();
    },
    onError: (e) => fail(toast, e, 'Could not save that fee.'),
  });

  return (
    <View style={{ gap: spacing }}>
      <ChipSelect
        label="Charged as"
        options={[
          { value: 'PERCENTAGE', label: 'Percentage of rent' },
          { value: 'FLAT', label: 'Flat amount' },
        ]}
        value={type}
        onChange={setType}
      />
      <TextField
        label={type === 'PERCENTAGE' ? 'Percent (0–100)' : 'Amount (₦)'}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={(v) => setValue(v.replace(/[^\d.]/g, ''))}
        error={value !== '' && !valid ? 'A percentage cannot exceed 100.' : null}
      />
      <Button
        label="Save fee"
        loading={save.isPending}
        disabled={!valid}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
