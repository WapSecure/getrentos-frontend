import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, FileSpreadsheet } from 'lucide-react-native';
import {
  Button,
  DateField,
  FormAlert,
  Text,
  TimeField,
  toISODate,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import {
  estateManagerApi,
  GUEST_LIST_CSV_TEMPLATE,
  HOUSEHOLDS_CSV_TEMPLATE,
  deadlineIso,
  importSummary,
  type CsvImportResult,
  type Household,
  type GuestListImportResult,
} from '@/lib/api/estateManager';
import type { PickedFile } from '@/lib/api/documents';
import { errorMessage } from '@/lib/api/client';
import { pickCsv } from '@/lib/filePicker';
import { CSV_MIME, shareTextFile } from '@/lib/shareFile';
import { FilePickRow } from '@/components/forms/FilePickRow';
import { HouseholdPicker } from '@/components/estate/HouseholdPicker';

/** A CSV slot: the shared file row, wired to the CSV picker. */
function CsvPick({
  file,
  onPick,
  label,
}: {
  file: PickedFile | null;
  onPick: (f: PickedFile) => void;
  label: string;
}) {
  return (
    <FilePickRow
      label={label}
      file={file}
      icon={FileSpreadsheet}
      emptyText="Choose a CSV file"
      onPick={async () => {
        const f = await pickCsv();
        if (f) onPick(f);
      }}
    />
  );
}

function TemplateLink({ csv, fileName }: { csv: string; fileName: string }) {
  const toast = useToast();
  return (
    <Button
      label="Get the CSV template"
      size="sm"
      variant="ghost"
      onPress={() =>
        shareTextFile(csv, fileName, CSV_MIME, 'CSV template').catch(() =>
          toast.show('Could not open the template.', 'error')
        )
      }
      style={{ alignSelf: 'flex-start' }}
    />
  );
}

/** Per-row result, with the spreadsheet's own line numbers so the office can fix them. */
function ImportOutcome({
  result,
  title,
  note,
  onDone,
}: {
  result: CsvImportResult;
  title: string;
  note?: string;
  onDone: () => void;
}) {
  const { colors, spacing } = useTheme();
  const clean = result.failed === 0;
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        {clean ? (
          <CheckCircle2 size={20} color={colors.success} />
        ) : (
          <AlertTriangle size={20} color={colors.warning} />
        )}
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {title}
        </Text>
      </View>
      {note ? (
        <Text variant="caption" color="mutedForeground">
          {note}
        </Text>
      ) : null}
      {result.errors.length ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            Rows that need attention
          </Text>
          {result.errors.map((e) => (
            <View key={`${e.row}-${e.message}`} style={{ gap: 2 }}>
              <Text variant="callout">
                Line {e.row}
                {e.unitLabel || e.visitorName ? `: ${e.unitLabel ?? e.visitorName}` : ''}
              </Text>
              <Text variant="caption" color="mutedForeground">
                {e.message}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <Button label="Done" onPress={onDone} />
    </View>
  );
}

export function ImportHouseholdsSheet({
  open,
  onClose,
  estateId,
}: {
  open: boolean;
  onClose: () => void;
  estateId: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Import households">
      {open ? <ImportHouseholds estateId={estateId} onDone={onClose} /> : null}
    </Sheet>
  );
}

function ImportHouseholds({ estateId, onDone }: { estateId: string; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const [file, setFile] = useState<PickedFile | null>(null);
  const run = useMutation({
    mutationFn: () => estateManagerApi.importHouseholds(estateId, file!),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.estateManager.estate(estateId) }),
  });
  if (run.data) {
    return (
      <ImportOutcome
        result={run.data}
        title={importSummary(run.data, ['household', 'households'])}
        onDone={onDone}
      />
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        A CSV with the columns unitLabel and residentName, and optionally contactPhone and
        contactEmail. The first row is read as headings.
      </Text>
      <TemplateLink csv={HOUSEHOLDS_CSV_TEMPLATE} fileName="households-template.csv" />
      <CsvPick file={file} onPick={setFile} label="Households file" />
      {run.isError ? (
        <FormAlert message={errorMessage(run.error, 'That file could not be read.')} />
      ) : null}
      <Button
        label="Import"
        loading={run.isPending}
        disabled={!file || run.isPending}
        onPress={() => run.mutate()}
      />
    </View>
  );
}

export function GuestListSheet({
  open,
  onClose,
  estateId,
}: {
  open: boolean;
  onClose: () => void;
  estateId: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Enter a guest list">
      {open ? <GuestList estateId={estateId} onDone={onClose} /> : null}
    </Sheet>
  );
}

function GuestList({ estateId, onDone }: { estateId: string; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const [household, setHousehold] = useState<Household | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [now] = useState(() => Date.now());
  const today = toISODate(new Date(now));
  const deadline = deadlineIso(date, time);
  const expiresAt = deadline && Date.parse(deadline) > now ? deadline : null;
  const run = useMutation({
    mutationFn: () =>
      estateManagerApi.importGuestList(estateId, {
        householdId: household!.id,
        expiresAt: expiresAt!,
        file: file!,
      }),
    // The board is refreshed even when every row was refused: the list was still read.
    onSettled: () => qc.invalidateQueries({ queryKey: qk.estateManager.expectedToday(estateId) }),
  });

  if (run.data) {
    const r: GuestListImportResult = run.data;
    return (
      <ImportOutcome
        result={r}
        title={r.label}
        note={`Each guest added holds a pass until ${r.deadlineLabel}.`}
        onDone={onDone}
      />
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        Every guest gets their own invitation, screened the same way a single one would be. Being on
        the list does not admit anyone: each guest still shows their own pass.
      </Text>

      <HouseholdPicker
        estateId={estateId}
        value={household}
        onChange={setHousehold}
        label="Whose guests are they?"
      />

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <DateField label="Valid until" value={date} onChange={setDate} min={today} />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField label="Time" value={time} onChange={setTime} />
        </View>
      </View>
      <Text variant="caption" color="mutedForeground">
        {deadline && !expiresAt
          ? 'Pick a time that hasn’t passed yet.'
          : 'After this, the passes stop working, even for a party.'}
      </Text>

      <Text variant="caption" color="mutedForeground">
        A CSV with a name column, and optional phone and purpose columns.
      </Text>
      <TemplateLink csv={GUEST_LIST_CSV_TEMPLATE} fileName="guest-list-template.csv" />
      <CsvPick file={file} onPick={setFile} label="Guest list" />
      {run.isError ? (
        <FormAlert message={errorMessage(run.error, 'That list could not be read.')} />
      ) : null}
      <Button
        label="Add guests"
        loading={run.isPending}
        disabled={!household || !expiresAt || !file || run.isPending}
        onPress={() => run.mutate()}
      />
    </View>
  );
}
