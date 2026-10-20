'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, Upload, Users } from 'lucide-react';
import { Alert, Badge, Button, Card, Field, Select, useToast } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { useCustody } from '@/components/agency/CustodyProvider';
import {
  TENANCIES_CSV_TEMPLATE,
  portfolioImportService,
  type TenancyImportResult,
} from '@/services/portfolioImportService';

/**
 * Bring the tenancies you take over onto GetRentos: each row becomes a signed
 * lease on an existing unit, with the deposit you hold recorded (not moved),
 * any arrears carried over as an opening balance, and rent billed on schedule
 * from the next due date. Dry run first; a file with errors imports nothing.
 */
export function TenancyImportCard() {
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
  const [preview, setPreview] = useState<TenancyImportResult | null>(null);
  const toast = useToast();
  const chosen = propertyId || properties[0]?.value || '';

  const call = async (dryRun: boolean) => {
    const res = await portfolioImportService.tenancies({
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
    onError: (e: Error) => toast.error(e.message),
  });
  const commit = useMutation({
    mutationFn: () => call(false),
    onSuccess: (r) => {
      setPreview(null);
      setCsv(null);
      toast.success(
        `Imported ${r.imported} tenanc${r.imported === 1 ? 'y' : 'ies'} into ${r.propertyTitle}${
          r.schedulesStarted ? `; rent schedules started for ${r.schedulesStarted}` : ''
        }.`
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || properties.length === 0) return null;
  const template = `data:text/csv;charset=utf-8,${encodeURIComponent(TENANCIES_CSV_TEMPLATE)}`;
  const canCommit =
    preview && !preview.fileError && preview.errors.length === 0 && preview.toImport.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-6 pb-6">
      <Card className="space-y-4 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Users className="h-5 w-5 text-primary" aria-hidden /> Import tenancies
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Taking over a property? Bring its tenants with you. Each row becomes a signed lease on a
            unit that is already on GetRentos. Deposits you hold are recorded as yours, arrears
            carry over as an opening balance, and rent is billed from the next due date.
          </p>
        </div>
        <Field label="Property">
          <Select
            value={chosen}
            onValueChange={(v) => {
              setPropertyId(v);
              setPreview(null);
            }}
            options={properties}
          />
        </Field>
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
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            icon={<Upload className="h-4 w-4" />}
          >
            {csv ? 'Choose another file' : 'Choose CSV'}
          </Button>
          {csv && <span className="text-sm text-foreground">{csv.name}</span>}
          <a
            href={template}
            download="getrentos-tenancies-template.csv"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Download className="h-4 w-4" /> Template
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Columns: unit_name, tenant_name, tenant_email (links their GetRentos account when it
          matches), tenant_phone, rent_amount, rent_period (ANNUAL or MONTHLY), lease_start,
          lease_end (YYYY-MM-DD), deposit_amount, arrears_amount and next_due_date (all optional).
        </p>
        <Button
          onClick={() => check.mutate()}
          disabled={!csv || !chosen}
          isLoading={check.isPending}
          loadingText="Checking…"
        >
          Check file
        </Button>
      </Card>

      {preview && (
        <Card className="mt-6 p-5">
          {preview.fileError ? (
            <Alert variant="danger">{preview.fileError}</Alert>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">{preview.toImport.length} to import</Badge>
                <Badge variant={preview.errors.length ? 'danger' : 'neutral'}>
                  {preview.errors.length} with errors
                </Badge>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Line</th>
                      <th className="py-2 pr-3 font-medium">Unit · tenant</th>
                      <th className="py-2 pr-3 font-medium">Rent · term</th>
                      <th className="py-2 pr-3 font-medium">Deposit · owed</th>
                      <th className="py-2 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {[
                      ...preview.toImport.map((r) => ({
                        line: r.line,
                        who: `${r.unitName} · ${r.tenantName}`,
                        rent: `${formatCurrency(r.rentAmount)} ${r.rentPeriod === 'MONTHLY' ? 'monthly' : 'yearly'} · ${formatDate(r.leaseStart)} – ${formatDate(r.leaseEnd)}`,
                        money: `${r.depositAmount ? formatCurrency(r.depositAmount) : '—'} · ${r.arrearsAmount ? formatCurrency(r.arrearsAmount) : '—'}`,
                        result: (
                          <span className="flex flex-wrap gap-1">
                            <Badge variant="success">Import</Badge>
                            <Badge variant={r.tenantAccount === 'LINKED' ? 'info' : 'neutral'}>
                              {r.tenantAccount === 'LINKED' ? 'Account linked' : 'Name only'}
                            </Badge>
                            {r.nextDueDate && (
                              <Badge variant="neutral">
                                Billing from {formatDate(r.nextDueDate)}
                              </Badge>
                            )}
                          </span>
                        ),
                      })),
                      ...preview.errors.map((r) => ({
                        line: r.line,
                        who: r.unitName || '—',
                        rent: '',
                        money: '',
                        result: (
                          <span className="text-xs text-destructive">{r.errors.join('; ')}</span>
                        ),
                      })),
                    ]
                      .sort((a, b) => a.line - b.line)
                      .map((r) => (
                        <tr key={r.line}>
                          <td className="py-2 pr-3 text-muted-foreground">{r.line}</td>
                          <td className="py-2 pr-3 text-foreground">{r.who}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{r.rent}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{r.money}</td>
                          <td className="py-2">{r.result}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <Button
                className="mt-4"
                onClick={() => commit.mutate()}
                disabled={!canCommit}
                isLoading={commit.isPending}
                loadingText="Importing…"
              >
                {`Import ${preview.toImport.length} tenanc${preview.toImport.length === 1 ? 'y' : 'ies'}`}
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
