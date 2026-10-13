'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Input,
  Pagination,
  type Column,
} from '@getrentos/ui';
import { EyeOff, Grid3x3, Pencil, Plus, RotateCcw, Search, Upload } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { cn } from '@/lib/cn';
import { landDeveloperService } from '@/services/landDeveloperService';
import { LAND_AREA_UNIT_LABELS } from '@/types/land';
import {
  LAND_PLOT_STATUSES,
  type LandLayoutStatus,
  type LandPlot,
  type LandPlotInput,
  type LandPlotStatus,
  type LandPlotUpdateInput,
} from '@/types/landDeveloper';
import { errorMessage, type Notify } from './feedback';
import { PLOT_STATUS, plotLabel } from './labels';
import { PlotFormDialog } from './PlotFormDialog';
import { PlotImportDialog } from './PlotImportDialog';

const PAGE_SIZE = 25;
const EDITABLE = new Set<LandPlotStatus>(['AVAILABLE', 'WITHHELD']);

interface PlotInventoryProps {
  propertyId: string;
  layoutStatus: LandLayoutStatus;
  notify: Notify;
}

/** The layout's plots: filter, search, add, import, edit, withhold and release. */
export const PlotInventory = ({ propertyId, layoutStatus, notify }: PlotInventoryProps) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<LandPlotStatus | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LandPlot | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [withholding, setWithholding] = useState<LandPlot | null>(null);
  const closed = layoutStatus === 'CLOSED';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: landDeveloperKeys.plots(propertyId, { status }),
    queryFn: () => unwrap(landDeveloperService.listPlots(propertyId, { status })),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: landDeveloperKeys.property(propertyId) });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const plots = data ?? [];
    if (!term) return plots;
    return plots.filter((plot) =>
      [plot.plotNumber, plot.block ?? '', ...plot.tags].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [data, search]);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const save = useMutation({
    mutationFn: (
      args:
        | { kind: 'create'; input: LandPlotInput }
        | { kind: 'update'; id: string; input: LandPlotUpdateInput }
    ) =>
      args.kind === 'create'
        ? unwrap(landDeveloperService.addPlot(propertyId, args.input))
        : unwrap(landDeveloperService.updatePlot(propertyId, args.id, args.input)),
    onSuccess: (plot, args) => {
      refresh();
      setFormOpen(false);
      setEditing(null);
      notify(args.kind === 'create' ? `${plotLabel(plot)} added.` : `${plotLabel(plot)} updated.`);
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  const move = useMutation({
    mutationFn: ({ plot, to }: { plot: LandPlot; to: 'withhold' | 'release' }) =>
      unwrap(
        to === 'withhold'
          ? landDeveloperService.withholdPlot(propertyId, plot.id)
          : landDeveloperService.releasePlot(propertyId, plot.id)
      ),
    onSuccess: (plot, { to }) => {
      refresh();
      notify(
        to === 'withhold'
          ? `${plotLabel(plot)} is off sale.`
          : `${plotLabel(plot)} is back on sale.`
      );
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  const columns: Column<LandPlot>[] = [
    {
      key: 'plot',
      header: 'Plot',
      render: (plot) => (
        <div>
          <p className="font-medium text-foreground">
            {plot.block ? `${plot.block} / ` : ''}
            {plot.plotNumber}
          </p>
          {(plot.isCorner || plot.tags.length > 0) && (
            <p className="text-xs text-muted-foreground">
              {[plot.isCorner ? 'Corner' : null, ...plot.tags].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (plot) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {plot.areaValue.toLocaleString('en-NG')} {LAND_AREA_UNIT_LABELS[plot.areaUnit]}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (plot) => (
        <div className="whitespace-nowrap">
          <p className="font-medium text-foreground">{formatCurrency(plot.price)}</p>
          {plot.pricePerSqm !== undefined && (
            <p className="text-xs text-muted-foreground">{formatCurrency(plot.pricePerSqm)}/sqm</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (plot) => (
        <div>
          <Badge variant={PLOT_STATUS[plot.status].variant}>{PLOT_STATUS[plot.status].label}</Badge>
          {plot.status === 'RESERVED' && plot.heldUntil && (
            <p className="mt-1 text-xs text-muted-foreground">
              Held until {formatDate(plot.heldUntil)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (plot) =>
        EDITABLE.has(plot.status) ? (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="xs"
              title="Edit plot"
              onClick={() => {
                setEditing(plot);
                setFormOpen(true);
              }}
              icon={<Pencil className="h-3.5 w-3.5" />}
            >
              Edit
            </Button>
            {plot.status === 'AVAILABLE' ? (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setWithholding(plot)}
                icon={<EyeOff className="h-3.5 w-3.5" />}
              >
                Withhold
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="xs"
                isLoading={move.isPending && move.variables?.plot.id === plot.id}
                onClick={() => move.mutate({ plot, to: 'release' })}
                icon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                Release
              </Button>
            )}
          </div>
        ) : null,
    },
  ];

  const filterOptions: { value: LandPlotStatus | undefined; label: string }[] = [
    { value: undefined, label: 'All' },
    ...LAND_PLOT_STATUSES.map((value) => ({ value, label: PLOT_STATUS[value].label })),
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 overflow-x-auto px-1">
          <div
            className="flex w-max gap-1 rounded-lg bg-secondary p-1"
            role="group"
            aria-label="Plot status"
          >
            {filterOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={status === option.value}
                onClick={() => {
                  setStatus(option.value);
                  setPage(1);
                }}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  status === option.value
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Plot, block or tag"
            aria-label="Search plots"
            leadingIcon={<Search className="h-4 w-4" />}
            className="sm:w-56"
          />
          <Button
            variant="outline"
            rounded="lg"
            disabled={closed}
            onClick={() => setImportOpen(true)}
            icon={<Upload className="h-4 w-4" />}
          >
            Import CSV
          </Button>
          <Button
            variant="primary"
            rounded="lg"
            disabled={closed}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            icon={<Plus className="h-4 w-4" />}
          >
            Add plot
          </Button>
        </div>
      </div>

      {closed && (
        <p className="text-sm text-muted-foreground">
          This estate is closed, so no new plots can be added. Reopen sales to add more.
        </p>
      )}

      {isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage(error, 'The plots could not be loaded.')}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={visible}
          getRowKey={(plot) => plot.id}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={Grid3x3}
              title={
                (data?.length ?? 0) === 0 && !status
                  ? 'No plots yet'
                  : 'No plots match these filters'
              }
              description={
                (data?.length ?? 0) === 0 && !status
                  ? 'Add plots one by one or import your plot schedule from a CSV file.'
                  : 'Try another status or search.'
              }
            />
          }
          footer={
            filtered.length > PAGE_SIZE ? (
              <div className="border-t border-border px-4 py-3">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={filtered.length}
                  onPageChange={setPage}
                />
              </div>
            ) : undefined
          }
        />
      )}

      <PlotFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        plot={editing}
        isSaving={save.isPending}
        onCreate={(input) => save.mutate({ kind: 'create', input })}
        onUpdate={(id, input) => save.mutate({ kind: 'update', id, input })}
      />

      {importOpen && (
        <PlotImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          propertyId={propertyId}
          onImported={(result) => {
            refresh();
            setImportOpen(false);
            notify(`${result.created} plot${result.created === 1 ? '' : 's'} imported.`);
          }}
        />
      )}

      <ConfirmDialog
        open={withholding !== null}
        onOpenChange={(open) => !open && setWithholding(null)}
        title={withholding ? `Withhold ${plotLabel(withholding)}?` : 'Withhold plot?'}
        description="The plot comes off sale and buyers can no longer reserve it. You can release it back on sale at any time."
        confirmLabel="Withhold plot"
        isLoading={move.isPending}
        onConfirm={async () => {
          if (!withholding) return;
          try {
            await move.mutateAsync({ plot: withholding, to: 'withhold' });
          } catch {
            // Reported by onError.
          }
        }}
      />
    </section>
  );
};
