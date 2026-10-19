'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentUpload,
  type PendingUpload,
} from '@getrentos/ui';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet } from 'lucide-react';
import { ApiError, unwrap } from '@/lib/apiHelpers';
import { downloadCsv } from '@/lib/export';
import { formatCurrency } from '@/lib/format';
import { landDeveloperService } from '@/services/landDeveloperService';
import { LAND_AREA_UNIT_LABELS } from '@/types/land';
import type { LandPlotImportResult, LandPlotImportRowError } from '@/types/landDeveloper';
import { errorMessage } from './feedback';
import {
  MAX_IMPORT_ROWS,
  PLOT_CSV_TEMPLATE_HEADERS,
  PLOT_CSV_TEMPLATE_ROWS,
  parsePlotCsv,
  type ParsedPlotFile,
} from './plotCsv';

interface PlotImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onImported: (result: LandPlotImportResult) => void;
}

interface ServerRejection {
  message: string;
  rowErrors: Map<number, string[]>;
  areaProblem?: string;
}

/** Reads the per-row errors out of a rejected import, when the API passed them on. */
const toRejection = (error: unknown): ServerRejection => {
  const rowErrors = new Map<number, string[]>();
  let areaProblem: string | undefined;
  if (error instanceof ApiError && error.details && typeof error.details === 'object') {
    const details = error.details as { errors?: unknown; areaProblem?: unknown };
    if (Array.isArray(details.errors)) {
      for (const entry of details.errors as LandPlotImportRowError[]) {
        if (typeof entry?.index === 'number' && Array.isArray(entry.errors)) {
          rowErrors.set(entry.index, entry.errors.map(String));
        }
      }
    }
    if (typeof details.areaProblem === 'string') areaProblem = details.areaProblem;
  }
  return { message: errorMessage(error), rowErrors, areaProblem };
};

const ImportBody = ({
  propertyId,
  onImported,
  onCancel,
}: Omit<PlotImportDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void }) => {
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const fileName = uploads[0]?.file.name ?? null;
  const [parsed, setParsed] = useState<ParsedPlotFile | null>(null);
  const [rejection, setRejection] = useState<ServerRejection | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  const importPlots = useMutation({
    mutationFn: (file: ParsedPlotFile) =>
      unwrap(
        landDeveloperService.importPlots(
          propertyId,
          file.rows.map((row) => row.plot)
        )
      ),
    onSuccess: (result) => onImported(result),
    onError: (error) => setRejection(toRejection(error)),
  });

  const handleFiles = async (next: PendingUpload[]) => {
    setUploads(next);
    setRejection(null);
    setReadError(null);
    const file = next[0]?.file;
    if (!file) {
      setParsed(null);
      return;
    }
    try {
      setParsed(parsePlotCsv(await file.text()));
    } catch {
      setParsed(null);
      setReadError('The file could not be read. Save it as CSV (comma separated) and try again.');
    }
  };

  const rowsWithClientErrors = parsed?.rows.filter((row) => row.errors.length > 0).length ?? 0;
  const canImport =
    parsed !== null &&
    parsed.rows.length > 0 &&
    parsed.fileErrors.length === 0 &&
    rowsWithClientErrors === 0;

  const flagged = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows
      .map((row) => ({
        ...row,
        problems: [...row.errors, ...(rejection?.rowErrors.get(row.index) ?? [])],
      }))
      .filter((row) => row.problems.length > 0);
  }, [parsed, rejection]);

  const preview = parsed?.rows.slice(0, 8) ?? [];

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-sm">
        <p className="text-foreground">
          Columns: <code className="text-xs">plotNumber</code>,{' '}
          <code className="text-xs">block</code>, <code className="text-xs">areaValue</code>,{' '}
          <code className="text-xs">areaUnit</code> (sqm, acres or hectares),{' '}
          <code className="text-xs">price</code> (whole naira),{' '}
          <code className="text-xs">isCorner</code> (yes/no) and{' '}
          <code className="text-xs">tags</code> (separated by ;). Up to{' '}
          {MAX_IMPORT_ROWS.toLocaleString('en-NG')} plots per file. The import is all or nothing.
        </p>
        <DocumentUpload
          className="mt-3"
          value={uploads}
          onChange={(next) => void handleFiles(next)}
          accept=".csv,text/csv"
          multiple={false}
          maxSizeMB={5}
          label="Plots CSV"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            rounded="lg"
            icon={<Download className="h-4 w-4" />}
            onClick={() =>
              downloadCsv('plots-template.csv', PLOT_CSV_TEMPLATE_HEADERS, PLOT_CSV_TEMPLATE_ROWS)
            }
          >
            Template
          </Button>
        </div>
        {fileName && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            {fileName}
            {parsed && ` · ${parsed.rows.length} plot${parsed.rows.length === 1 ? '' : 's'}`}
          </p>
        )}
      </div>

      {readError && <p className="text-sm text-destructive">{readError}</p>}

      {parsed && parsed.fileErrors.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {parsed.fileErrors.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      {parsed && parsed.ignoredColumns.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Ignored columns: {parsed.ignoredColumns.join(', ')}.
        </p>
      )}

      {rejection && (
        <div
          role="alert"
          className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <div className="text-foreground">
            <p className="font-medium">Nothing was imported.</p>
            <p className="text-muted-foreground">{rejection.message}</p>
            {rejection.areaProblem && (
              <p className="text-muted-foreground">{rejection.areaProblem}</p>
            )}
          </div>
        </div>
      )}

      {flagged.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground">
            {flagged.length} row{flagged.length === 1 ? '' : 's'} to fix
          </p>
          <ul className="mt-2 max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-border p-3 text-sm">
            {flagged.map((row) => (
              <li key={row.index}>
                <span className="font-medium text-foreground">
                  Line {row.line}
                  {row.plot.plotNumber ? ` (plot ${row.plot.plotNumber})` : ''}:
                </span>{' '}
                <span className="text-destructive">{row.problems.join(' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canImport && flagged.length === 0 && preview.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Plot</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {preview.map((row) => (
                <tr key={row.index}>
                  <td className="px-3 py-2 text-foreground">
                    {row.plot.block ? `${row.plot.block} / ` : ''}
                    {row.plot.plotNumber}
                    {row.plot.isCorner ? ' · corner' : ''}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.plot.areaValue} {LAND_AREA_UNIT_LABELS[row.plot.areaUnit]}
                  </td>
                  <td className="px-3 py-2 text-right text-foreground">
                    {formatCurrency(row.plot.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {parsed && parsed.rows.length > preview.length && (
            <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              and {parsed.rows.length - preview.length} more
            </p>
          )}
        </div>
      )}

      {canImport && !rejection && (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          The file looks good. The server will also check sizes against the parcel and existing
          plots.
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={importPlots.isPending}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={!canImport}
          isLoading={importPlots.isPending}
          onClick={() => parsed && importPlots.mutate(parsed)}
        >
          Import {parsed?.rows.length ? `${parsed.rows.length} plots` : 'plots'}
        </Button>
      </div>
    </div>
  );
};

/** Bulk plot import from a CSV: parsed and checked in the browser, then sent in one batch. */
export const PlotImportDialog = ({ open, onOpenChange, ...rest }: PlotImportDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl">
      <DialogTitle className="text-lg font-semibold text-foreground">Import plots</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Upload your plot schedule as a CSV file.
      </DialogDescription>
      <ImportBody {...rest} onCancel={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
);
