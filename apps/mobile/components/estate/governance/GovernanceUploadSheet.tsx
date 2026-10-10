import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Lock, Paperclip } from 'lucide-react-native';
import {
  Button,
  Checkbox,
  DateField,
  FormAlert,
  SegmentedControl,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { errorText } from '@/components/estate/EstateUI';
import { isUpgradeError } from '@/components/host/HostUI';
import type { PickedFile } from '@/lib/api/documents';
import {
  GOVERNANCE_MAX_BYTES,
  GOVERNANCE_TITLE_MAX,
  GOVERNANCE_TYPES,
  estateGovernanceApi,
  governanceKeys,
  type GovernanceRecord,
  type GovernanceRecordType,
} from '@/lib/api/estateGovernance';
import { haptics } from '@/lib/haptics';

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Upload a governance document, or the next version of `newVersionOf`. Asking
 * the committee to sign is Pro: offered locked on a free estate rather than
 * hidden, so the manager knows it exists.
 */
export function GovernanceUploadSheet({
  open,
  onClose,
  estateId,
  newVersionOf,
  freeEstate,
}: {
  open: boolean;
  onClose: () => void;
  estateId: string;
  newVersionOf?: GovernanceRecord | null;
  freeEstate: boolean;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={newVersionOf ? 'Upload a new version' : 'Upload a record'}
    >
      {open ? (
        <UploadForm
          key={newVersionOf?.id ?? 'new'}
          estateId={estateId}
          newVersionOf={newVersionOf ?? undefined}
          freeEstate={freeEstate}
          onDone={onClose}
        />
      ) : null}
    </Sheet>
  );
}

function UploadForm({
  estateId,
  newVersionOf,
  freeEstate,
  onDone,
}: {
  estateId: string;
  newVersionOf?: GovernanceRecord;
  freeEstate: boolean;
  onDone: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState(newVersionOf?.title ?? '');
  const [type, setType] = useState<GovernanceRecordType>(newVersionOf?.type ?? 'bylaws');
  const [meetingDate, setMeetingDate] = useState('');
  const [requiresSignatures, setRequiresSignatures] = useState(false);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [MIME.pdf, MIME.doc, MIME.docx],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > GOVERNANCE_MAX_BYTES) {
      setFileError('That file is over 20 MB. Choose a smaller one.');
      return;
    }
    const ext = asset.name.split('.').pop()?.toLowerCase() ?? '';
    setFileError(null);
    setFile({
      uri: asset.uri,
      name: asset.name,
      mimeType:
        asset.mimeType && asset.mimeType !== 'application/octet-stream'
          ? asset.mimeType
          : (MIME[ext] ?? 'application/octet-stream'),
    });
  };

  const upload = useMutation({
    mutationFn: () =>
      estateGovernanceApi.uploadGovernance(estateId, {
        title: title.trim(),
        type,
        meetingDate: type === 'meeting_minutes' && meetingDate ? meetingDate : undefined,
        newVersionOfId: newVersionOf?.id,
        requiresSignatures,
        file: file!,
      }),
    onSuccess: (saved) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: governanceKeys.all(estateId) });
      toast.show(
        saved.requiresSignatures
          ? 'Uploaded. Committee members can now sign it in their app.'
          : newVersionOf
            ? `Version ${saved.version} uploaded.`
            : 'Record uploaded.',
        'success'
      );
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      {newVersionOf ? (
        <Text variant="callout" color="mutedForeground">
          Replaces the current version of “{newVersionOf.title}”. Earlier versions stay in its
          history.
        </Text>
      ) : null}
      <TextField
        label="Title"
        value={title}
        onChangeText={setTitle}
        maxLength={GOVERNANCE_TITLE_MAX}
        placeholder="e.g. 2026 bylaws amendment"
        autoFocus={!newVersionOf}
      />
      <View style={{ gap: spacing.xs }}>
        <Text variant="bodyStrong">Type</Text>
        <SegmentedControl
          accessibilityLabel="Record type"
          value={type}
          onChange={setType}
          options={GOVERNANCE_TYPES}
        />
      </View>
      {type === 'meeting_minutes' ? (
        <DateField
          label="Meeting date (optional)"
          value={meetingDate}
          onChange={setMeetingDate}
          max={toISODate(new Date())}
        />
      ) : null}

      <Pressable
        onPress={pick}
        accessibilityRole="button"
        accessibilityLabel={file ? `Chosen file ${file.name}. Choose another` : 'Choose a file'}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderStyle: file ? 'solid' : 'dashed',
          borderColor: fileError ? colors.destructive : colors.border,
          backgroundColor: file ? colors.accent : 'transparent',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {file ? (
          <FileText size={18} color={colors.primary} />
        ) : (
          <Paperclip size={18} color={colors.mutedForeground} />
        )}
        <View style={{ flex: 1 }}>
          <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
            {file ? file.name : 'Choose a file'}
          </Text>
          <Text variant="caption" color={fileError ? 'destructive' : 'mutedForeground'}>
            {fileError ?? (file ? 'Tap to choose another' : 'PDF or Word, up to 20 MB')}
          </Text>
        </View>
      </Pressable>

      {freeEstate ? (
        <Pressable
          onPress={() => router.push('/(app)/billing')}
          accessibilityRole="button"
          accessibilityLabel="Asking the committee to sign is part of Pro. See plans."
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 }}
        >
          <Lock size={16} color={colors.mutedForeground} />
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            Ask every committee member to sign before it’s approved
          </Text>
          <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
            Pro
          </Text>
        </Pressable>
      ) : (
        <Checkbox
          checked={requiresSignatures}
          onChange={setRequiresSignatures}
          label="Ask every committee member to sign before it’s approved"
        />
      )}

      {upload.error ? (
        isUpgradeError(upload.error) ? (
          <FormAlert
            tone="warning"
            title="Committee signatures are part of Pro"
            message="Plain uploads stay free. Untick signatures to upload it now, or upgrade."
          />
        ) : (
          <FormAlert message={errorText(upload.error, 'Could not upload this record.')} />
        )
      ) : null}
      <Button
        label={newVersionOf ? 'Upload new version' : 'Upload'}
        disabled={!title.trim() || !file}
        loading={upload.isPending}
        onPress={() => upload.mutate()}
      />
      {upload.error && isUpgradeError(upload.error) ? (
        <Button
          label="See plans"
          variant="secondary"
          onPress={() => router.push('/(app)/billing')}
        />
      ) : null}
    </View>
  );
}
