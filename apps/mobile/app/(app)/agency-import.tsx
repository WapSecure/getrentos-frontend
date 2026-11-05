import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileSpreadsheet } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormAlert,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
  useToast,
  type BadgeTone,
} from '@getrentos/ui-native';
import { useCustody } from '@/lib/agency/custody';
import {
  canImport,
  MAX_CSV_CHARS,
  portfolioImportApi,
  readCsv,
  TENANCIES_CSV_TEMPLATE,
  UNITS_CSV_TEMPLATE,
  type TenancyImportResult,
  type UnitImportResult,
} from '@/lib/api/portfolioImport';
import { ApiError } from '@/lib/api/client';
import { pickCsv } from '@/lib/filePicker';
import { CSV_MIME, shareDownloadedFile } from '@/lib/shareFile';
import { formatDate, formatNaira } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

type Kind = 'units' | 'tenancies';
const errorText = (e: unknown, fallback: string) =>
  e instanceof ApiError || e instanceof Error ? e.message : fallback;

/**
 * Bring a managed property's units, then its tenants, onto GetRentos from a
 * spreadsheet. Always a dry run first; a file with any error imports nothing.
 */
export default function AgencyImport() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { live, loading } = useCustody();
  const [kind, setKind] = useState<Kind>('units');
  const properties = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of live)
      if (!seen.has(m.propertyId)) seen.set(m.propertyId, m.propertyTitle ?? 'Property');
    return [...seen].map(([value, label]) => ({ value, label }));
  }, [live]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Agency"
        title="Import from a spreadsheet"
        subtitle="Units first, then the tenants in them"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.md,
        }}
      >
        {loading ? (
          <Skeleton height={200} />
        ) : properties.length === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet size={32} color={colors.mutedForeground} />}
            title="No live properties"
            description="You can import into properties your firm manages. None are live yet."
          />
        ) : (
          <>
            <SegmentedControl
              options={[
                { value: 'units', label: 'Units' },
                { value: 'tenancies', label: 'Tenancies' },
              ]}
              value={kind}
              onChange={(v) => setKind(v as Kind)}
            />
            {/* Keyed so switching resets the file and the dry run. */}
            <Importer key={kind} kind={kind} properties={properties} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Importer({
  kind,
  properties,
}: {
  kind: Kind;
  properties: { value: string; label: string }[];
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [propertyId, setPropertyId] = useState(properties[0].value);
  const [csv, setCsv] = useState<{ name: string; text: string } | null>(null);
  const [preview, setPreview] = useState<UnitImportResult | TenancyImportResult | null>(null);
  const call = (dryRun: boolean): Promise<UnitImportResult | TenancyImportResult> => {
    const body = { propertyId, csv: csv?.text ?? '', dryRun };
    return kind === 'units' ? portfolioImportApi.units(body) : portfolioImportApi.tenancies(body);
  };
  const check = useMutation({
    mutationFn: () => call(true),
    onSuccess: setPreview,
    onError: (e) => toast.show(errorText(e, 'Could not check the file.'), 'error'),
  });
  const commit = useMutation({
    mutationFn: () => call(false),
    onSuccess: (r) => {
      setPreview(null);
      setCsv(null);
      qc.invalidateQueries({ queryKey: ['agency'] });
      toast.show(
        'created' in r
          ? `Imported ${r.created} unit${r.created === 1 ? '' : 's'} into ${r.propertyTitle}.`
          : `Imported ${r.imported} tenanc${r.imported === 1 ? 'y' : 'ies'} into ${r.propertyTitle}${
              r.schedulesStarted ? `; rent schedules started for ${r.schedulesStarted}` : ''
            }.`,
        'success'
      );
    },
    onError: (e) => toast.show(errorText(e, 'Nothing was imported.'), 'error'),
  });
  const choose = async () => {
    const file = await pickCsv();
    if (!file) return;
    try {
      const text = await readCsv(file);
      if (text.length > MAX_CSV_CHARS) {
        toast.show('That file is too big. Split it into smaller files.', 'error');
        return;
      }
      setCsv({ name: file.name, text });
      setPreview(null);
    } catch {
      toast.show('Could not read that file.', 'error');
    }
  };
  const rows = preview ? ('toCreate' in preview ? preview.toCreate : preview.toImport).length : 0;

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        {kind === 'units'
          ? 'Add a property’s units from a CSV. Units already on the property are skipped by name.'
          : 'Taking over a property? Each row becomes a signed lease on a unit already on GetRentos. Deposits you hold are recorded as yours, arrears carry over as an opening balance, and rent is billed from the next due date.'}
      </Text>
      <ChipSelect
        label="Property"
        options={properties}
        value={propertyId}
        onChange={(v) => {
          setPropertyId(v);
          setPreview(null);
        }}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Button
          label={csv ? 'Choose another file' : 'Choose CSV'}
          size="sm"
          variant="secondary"
          onPress={choose}
        />
        <Button
          label="Get the template"
          size="sm"
          variant="ghost"
          onPress={() =>
            shareDownloadedFile(
              new TextEncoder().encode(
                kind === 'units' ? UNITS_CSV_TEMPLATE : TENANCIES_CSV_TEMPLATE
              ),
              kind === 'units'
                ? 'getrentos-units-template.csv'
                : 'getrentos-tenancies-template.csv',
              CSV_MIME,
              'CSV template'
            ).catch(() => toast.show('Could not open the template.', 'error'))
          }
        />
      </View>
      {csv ? <Text variant="callout">{csv.name}</Text> : null}
      <Text variant="caption" color="mutedForeground">
        {kind === 'units'
          ? 'Columns: unit_name, bedrooms, bathrooms, asking_rent (naira, optional), rent_period (ANNUAL or MONTHLY, default ANNUAL).'
          : 'Columns: unit_name, tenant_name, tenant_email (links their account when it matches), tenant_phone, rent_amount, rent_period, lease_start, lease_end (YYYY-MM-DD), deposit_amount, arrears_amount, next_due_date (all optional).'}
      </Text>
      <Button
        label="Check file"
        loading={check.isPending}
        disabled={!csv || check.isPending}
        onPress={() => check.mutate()}
      />

      {preview ? (
        <Card style={{ gap: spacing.md }}>
          {preview.fileError ? (
            <FormAlert message={preview.fileError} />
          ) : (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <Badge label={`${rows} to ${kind === 'units' ? 'add' : 'import'}`} tone="success" />
                {'skipped' in preview ? (
                  <Badge label={`${preview.skipped.length} already there`} tone="neutral" />
                ) : null}
                <Badge
                  label={`${preview.errors.length} with errors`}
                  tone={preview.errors.length ? 'danger' : 'neutral'}
                />
              </View>
              {previewRows(preview).map((r) => (
                <PreviewRow key={`${r.line}-${r.title}`} {...r} />
              ))}
              <Button
                label={`Import ${rows} ${kind === 'units' ? (rows === 1 ? 'unit' : 'units') : rows === 1 ? 'tenancy' : 'tenancies'}`}
                loading={commit.isPending}
                disabled={!canImport(preview, rows) || commit.isPending}
                onPress={() => commit.mutate()}
              />
              {preview.errors.length ? (
                <Text variant="caption" color="mutedForeground">
                  Fix the rows with errors and check the file again. Nothing is imported while any
                  row has an error.
                </Text>
              ) : null}
            </>
          )}
        </Card>
      ) : null}
    </View>
  );
}

type Row = {
  line: number;
  title: string;
  detail?: string;
  tags: { label: string; tone: BadgeTone }[];
};

function previewRows(p: UnitImportResult | TenancyImportResult): Row[] {
  const out: Row[] = [];
  if ('toCreate' in p) {
    for (const r of p.toCreate)
      out.push({
        line: r.line,
        title: r.unitName,
        detail: `${r.bedrooms} bed · ${r.bathrooms} bath${
          r.askingRent !== null
            ? ` · ${formatNaira(r.askingRent)} ${r.rentPeriod === 'MONTHLY' ? 'monthly' : 'yearly'}`
            : ''
        }`,
        tags: [{ label: 'Add', tone: 'success' }],
      });
    for (const r of p.skipped)
      out.push({ line: r.line, title: r.unitName, detail: r.reason, tags: [] });
  } else {
    for (const r of p.toImport)
      out.push({
        line: r.line,
        title: `${r.unitName} · ${r.tenantName}`,
        detail: `${formatNaira(r.rentAmount)} ${r.rentPeriod === 'MONTHLY' ? 'monthly' : 'yearly'} · ${formatDate(r.leaseStart, 'short')} to ${formatDate(r.leaseEnd, 'short')}${
          r.depositAmount ? ` · deposit ${formatNaira(r.depositAmount)}` : ''
        }${r.arrearsAmount ? ` · arrears ${formatNaira(r.arrearsAmount)}` : ''}`,
        tags: [
          { label: 'Import', tone: 'success' },
          {
            label: r.tenantAccount === 'LINKED' ? 'Account linked' : 'Name only',
            tone: r.tenantAccount === 'LINKED' ? 'info' : 'neutral',
          },
          ...(r.nextDueDate
            ? [
                {
                  label: `Billing from ${formatDate(r.nextDueDate, 'short')}`,
                  tone: 'neutral' as const,
                },
              ]
            : []),
        ],
      });
  }
  for (const r of p.errors)
    out.push({
      line: r.line,
      title: r.unitName || 'Unnamed row',
      detail: r.errors.join('; '),
      tags: [{ label: 'Error', tone: 'danger' }],
    });
  return out.sort((a, b) => a.line - b.line);
}

function PreviewRow({ line, title, detail, tags }: Row) {
  const { colors, spacing } = useTheme();
  const isError = tags.some((t) => t.tone === 'danger');
  return (
    <View
      style={{ gap: 2, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}
    >
      <Text variant="callout" style={{ fontWeight: '600' }}>
        Line {line}: {title}
      </Text>
      {detail ? (
        <Text
          variant="caption"
          style={{ color: isError ? colors.destructive : colors.mutedForeground }}
        >
          {detail}
        </Text>
      ) : null}
      {tags.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {tags.map((t) => (
            <Badge key={t.label} label={t.label} tone={t.tone} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
