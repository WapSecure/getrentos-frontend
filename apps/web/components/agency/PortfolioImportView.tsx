'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { Badge, Button, Card, Select, Toast, type ToastVariant } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { useCustody } from '@/components/agency/CustodyProvider';
import {
  UNITS_CSV_TEMPLATE,
  portfolioImportService,
  type UnitImportResult,
} from '@/services/portfolioImportService';

/**
 * Bring an existing block's units onto GetRentos from a spreadsheet. Always a
 * dry run first: you see exactly what would be added, skipped and why any row
 * is refused before anything is written. Importing is all-or-nothing.
 */
export function PortfolioImportView() {
  const { live, loading } = useCustody();
  const fileRef = useRef<HTMLInputElement>(null);
  const properties = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of live)
      if (!seen.has(m.propertyId)) seen.set(m.propertyId, m.propertyTitle ?? 'Property');
    return [...seen].map(([value, label]) => ({ value, label }));
  }, [live]);
  const [propertyId, setPropertyId] = useState('');
  const [csv, setCsv] = useState<{ name: string; text: string } | null>(null);
  const [preview, setPreview] = useState<UnitImportResult | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const chosen = propertyId || properties[0]?.value || '';

  const call = async (dryRun: boolean) => {
    const res = await portfolioImportService.units({
      propertyId: chosen,
      csv: csv?.text ?? '',
      dryRun,
    });
    if (!res.success) throw new Error(res.error || 'Import failed.');
    return res.data!;
  };
  const check = useMutation({
    mutationFn: () => call(true),
    onSuccess: setPreview,
    onError: (e: Error) => setToast({ message: e.message, variant: 'error' }),
  });
  const commit = useMutation({
    mutationFn: () => call(false),
    onSuccess: (r) => {
      setPreview(null);
      setCsv(null);
      setToast({
        message: `Imported ${r.created} unit${r.created === 1 ? '' : 's'} into ${r.propertyTitle}.`,
        variant: 'success',
      });
    },
    onError: (e: Error) => setToast({ message: e.message, variant: 'error' }),
  });

  const template = `data:text/csv;charset=utf-8,${encodeURIComponent(UNITS_CSV_TEMPLATE)}`;
  const canCommit =
    preview && !preview.fileError && preview.errors.length === 0 && preview.toCreate.length > 0;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <FileSpreadsheet className="h-6 w-6 text-primary" aria-hidden />
          Import units
        </h1>
        <p className="mt-1 text-muted-foreground">
          Add a property’s units from a CSV. You’ll see a dry run first; nothing is written until
          you import, and a file with errors imports nothing.
        </p>
      </div>

      <Card className="space-y-4 p-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading the properties you manage…</p>
        ) : properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You can import into properties your firm manages. There are none live yet.
          </p>
        ) : (
          <>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Property</span>
              <Select
                value={chosen}
                onValueChange={(v) => {
                  setPropertyId(v);
                  setPreview(null);
                }}
                options={properties}
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setCsv({ name: file.name, text: await file.text() });
                  setPreview(null);
                }}
              />
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> {csv ? 'Choose another file' : 'Choose CSV'}
              </Button>
              {csv && <span className="text-sm text-foreground">{csv.name}</span>}
              <a
                href={template}
                download="getrentos-units-template.csv"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Download className="h-4 w-4" /> Template
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Columns: unit_name, bedrooms, bathrooms, asking_rent (naira, optional), rent_period
              (ANNUAL or MONTHLY, default ANNUAL). Units already on the property are skipped by
              name.
            </p>
            <Button onClick={() => check.mutate()} disabled={!csv || !chosen || check.isPending}>
              {check.isPending ? 'Checking…' : 'Check file'}
            </Button>
          </>
        )}
      </Card>

      {preview && (
        <Card className="mt-6 p-5">
          {preview.fileError ? (
            <p className="text-sm text-destructive">{preview.fileError}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">{preview.toCreate.length} to add</Badge>
                <Badge variant="neutral">{preview.skipped.length} already there</Badge>
                <Badge variant={preview.errors.length ? 'danger' : 'neutral'}>
                  {preview.errors.length} with errors
                </Badge>
              </div>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Line</th>
                    <th className="py-2 pr-3 font-medium">Unit</th>
                    <th className="py-2 pr-3 font-medium">Beds / baths</th>
                    <th className="py-2 pr-3 font-medium">Asking rent</th>
                    <th className="py-2 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {[
                    ...preview.toCreate.map((r) => ({
                      line: r.line,
                      unit: r.unitName,
                      size: `${r.bedrooms} / ${r.bathrooms}`,
                      rent:
                        r.askingRent !== null
                          ? `${formatCurrency(r.askingRent)} ${r.rentPeriod === 'MONTHLY' ? 'monthly' : 'yearly'}`
                          : '—',
                      result: <Badge variant="success">Add</Badge>,
                    })),
                    ...preview.skipped.map((r) => ({
                      line: r.line,
                      unit: r.unitName,
                      size: '',
                      rent: '',
                      result: <span className="text-xs text-muted-foreground">{r.reason}</span>,
                    })),
                    ...preview.errors.map((r) => ({
                      line: r.line,
                      unit: r.unitName || '—',
                      size: '',
                      rent: '',
                      result: (
                        <span className="text-xs text-destructive">{r.errors.join('; ')}</span>
                      ),
                    })),
                  ]
                    .sort((a, b) => a.line - b.line)
                    .map((r) => (
                      <tr key={r.line}>
                        <td className="py-2 pr-3 text-muted-foreground">{r.line}</td>
                        <td className="py-2 pr-3 text-foreground">{r.unit}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{r.size}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{r.rent}</td>
                        <td className="py-2">{r.result}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <Button
                className="mt-4"
                onClick={() => commit.mutate()}
                disabled={!canCommit || commit.isPending}
              >
                {commit.isPending
                  ? 'Importing…'
                  : `Import ${preview.toCreate.length} unit${preview.toCreate.length === 1 ? '' : 's'}`}
              </Button>
              {preview.errors.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Fix the rows with errors and check the file again.
                </p>
              )}
            </>
          )}
        </Card>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
