'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Boxes,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  MoreHorizontal,
  PackagePlus,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { DatePicker } from '@/components/ui/DatePicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toast, type ToastVariant } from '@/components/ui/Toast';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type CreateHomeAssetInput,
  type HomeAsset,
  type HomeAssetStatus,
  type HomeManagementProperty,
} from '@/services/homeManagementService';

type AssetForm = {
  propertyId: string;
  unitId: string;
  name: string;
  category: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  installedAt: string;
  warrantyExpiresAt: string;
};

const initialAssetForm: AssetForm = {
  propertyId: '',
  unitId: '',
  name: '',
  category: '',
  manufacturer: '',
  modelNumber: '',
  serialNumber: '',
  installedAt: '',
  warrantyExpiresAt: '',
};

const assetStatus: Record<HomeAsset['status'], { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  NEEDS_SERVICE: { label: 'Needs service', variant: 'warning' },
  RETIRED: { label: 'Retired', variant: 'neutral' },
};

const lifecycleActions: Record<
  HomeAssetStatus,
  Array<{ status: HomeAssetStatus; label: string; icon: typeof CircleAlert; destructive?: boolean }>
> = {
  ACTIVE: [
    { status: 'NEEDS_SERVICE', label: 'Mark needs service', icon: CircleAlert },
    { status: 'RETIRED', label: 'Retire asset', icon: Archive, destructive: true },
  ],
  NEEDS_SERVICE: [
    { status: 'ACTIVE', label: 'Mark active', icon: CircleCheck },
    { status: 'RETIRED', label: 'Retire asset', icon: Archive, destructive: true },
  ],
  RETIRED: [{ status: 'ACTIVE', label: 'Reactivate asset', icon: RotateCcw }],
};

const lifecycleSuccessMessage: Record<HomeAssetStatus, string> = {
  ACTIVE: 'Asset marked active.',
  NEEDS_SERVICE: 'Asset marked as needing service.',
  RETIRED: 'Asset retired from active operations.',
};

const trimOptional = (value: string) => value.trim() || undefined;

const propertyLabel = (property: HomeManagementProperty) =>
  property.title ?? property.name ?? 'Unnamed property';

const assetPropertyLabel = (asset: HomeAsset, properties: HomeManagementProperty[]) =>
  asset.property?.title ??
  asset.property?.name ??
  properties.find((property) => property.id === asset.propertyId && propertyLabel(property))
    ?.title ??
  properties.find((property) => property.id === asset.propertyId && propertyLabel(property))
    ?.name ??
  'Property';

const isWarrantyExpiring = (date?: string | null) => {
  if (!date) return false;
  const expiresAt = new Date(date).getTime();
  const now = Date.now();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  return expiresAt >= now && expiresAt - now <= ninetyDays;
};

interface HomeAssetRegistryProps {
  assets: HomeAsset[];
  properties: HomeManagementProperty[];
  isLoading?: boolean;
  error?: Error | null;
}

export function HomeAssetRegistry({
  assets,
  properties,
  isLoading = false,
  error,
}: HomeAssetRegistryProps) {
  const queryClient = useQueryClient();
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<AssetForm>(initialAssetForm);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const unitsQuery = useQuery({
    enabled: isCreateOpen && Boolean(form.propertyId),
    queryKey: homeManagementKeys.units(form.propertyId),
    queryFn: () => unwrap(homeManagementService.listUnits(form.propertyId)),
  });
  const units = unitsQuery.data ?? [];

  const visibleAssets = useMemo(
    () =>
      selectedPropertyId
        ? assets.filter((asset) => asset.propertyId === selectedPropertyId)
        : assets,
    [assets, selectedPropertyId]
  );

  const createAsset = useMutation({
    mutationFn: (input: CreateHomeAssetInput) => unwrap(homeManagementService.createAsset(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.assets() });
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.dashboard });
      setForm(initialAssetForm);
      setIsCreateOpen(false);
      setToast({ message: 'Asset added to your home register.', variant: 'success' });
    },
    onError: (mutationError: Error) => {
      setToast({ message: mutationError.message || 'Unable to add this asset.', variant: 'error' });
    },
  });

  const updateAssetStatus = useMutation({
    mutationFn: ({ assetId, status }: { assetId: string; status: HomeAssetStatus }) =>
      unwrap(homeManagementService.updateAssetStatus(assetId, status)),
    onSuccess: (_asset, variables) => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.assets() });
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.plans });
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.dashboard });
      setToast({ message: lifecycleSuccessMessage[variables.status], variant: 'success' });
    },
    onError: (mutationError: Error) => {
      setToast({
        message: mutationError.message || 'Unable to update the asset lifecycle.',
        variant: 'error',
      });
    },
  });

  const submitAsset = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.propertyId || !form.name.trim() || !form.category.trim()) return;

    createAsset.mutate({
      propertyId: form.propertyId,
      unitId: form.unitId || undefined,
      name: form.name.trim(),
      category: form.category.trim(),
      manufacturer: trimOptional(form.manufacturer),
      modelNumber: trimOptional(form.modelNumber),
      serialNumber: trimOptional(form.serialNumber),
      installedAt: form.installedAt || undefined,
      warrantyExpiresAt: form.warrantyExpiresAt || undefined,
    });
  };

  const activeAssets = assets.filter((asset) => asset.status === 'ACTIVE').length;
  const plannedAssets = assets.filter((asset) => (asset.preventivePlans?.length ?? 0) > 0).length;
  const expiringWarranties = assets.filter((asset) =>
    isWarrantyExpiring(asset.warrantyExpiresAt)
  ).length;
  const hasProperties = properties.length > 0;

  return (
    <section aria-labelledby="asset-registry-heading" className="mt-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Asset register</p>
          <h2
            id="asset-registry-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            Keep every system on record.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Record appliances, building systems, warranties, and the preventive care linked to each
            home.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            ariaLabel="Filter assets by property"
            className="min-w-56"
            value={selectedPropertyId}
            onValueChange={setSelectedPropertyId}
            options={[
              { value: '', label: 'All properties' },
              ...properties.map((property) => ({
                value: property.id,
                label: propertyLabel(property),
              })),
            ]}
          />
          <Button
            icon={<PackagePlus className="h-4 w-4" />}
            rounded="md"
            disabled={!hasProperties}
            title={hasProperties ? undefined : 'Add a property before adding assets'}
            onClick={() => setIsCreateOpen(true)}
          >
            Add asset
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <AssetSummary
          icon={<Boxes className="h-4 w-4" />}
          label="Active assets"
          value={activeAssets}
        />
        <AssetSummary
          icon={<CalendarClock className="h-4 w-4" />}
          label="Covered by a plan"
          value={plannedAssets}
        />
        <AssetSummary
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Warranties expiring"
          value={expiringWarranties}
        />
      </div>

      <div className="mt-5">
        {isLoading ? (
          <AssetLoadingState />
        ) : error ? (
          <EmptyState
            icon={CircleAlert}
            title="Assets could not be loaded"
            description="Refresh the page to try again."
          />
        ) : visibleAssets.length === 0 ? (
          <EmptyState
            icon={Archive}
            title={
              !hasProperties
                ? 'Add a property before creating an asset register'
                : selectedPropertyId
                  ? 'No assets for this property'
                  : 'Your asset register is empty'
            }
            description={
              !hasProperties
                ? 'Assets must always belong to a property in your portfolio.'
                : 'Start with equipment that needs servicing, warranty tracking, or recurring care.'
            }
            action={
              hasProperties ? (
                <Button size="sm" rounded="md" onClick={() => setIsCreateOpen(true)}>
                  Add the first asset
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleAssets.map((asset) => {
              const status = assetStatus[asset.status];
              const nextPlan = asset.preventivePlans?.[0];

              return (
                <article
                  key={asset.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <h3 className="mt-3 truncate font-semibold text-foreground">{asset.name}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">{asset.category}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
                    <AssetDetail label="Property" value={assetPropertyLabel(asset, properties)} />
                    {asset.unit?.unitName && (
                      <AssetDetail label="Unit" value={asset.unit.unitName} />
                    )}
                    {(asset.manufacturer || asset.modelNumber) && (
                      <AssetDetail
                        label="Make & model"
                        value={[asset.manufacturer, asset.modelNumber].filter(Boolean).join(' · ')}
                      />
                    )}
                    {asset.serialNumber && (
                      <AssetDetail label="Serial" value={asset.serialNumber} />
                    )}
                  </div>

                  <div className="mt-4 space-y-2 rounded-xl bg-secondary/70 p-3 text-xs">
                    {asset.warrantyExpiresAt ? (
                      <p
                        className={
                          isWarrantyExpiring(asset.warrantyExpiresAt)
                            ? 'font-medium text-amber-700 dark:text-amber-400'
                            : 'text-muted-foreground'
                        }
                      >
                        Warranty{' '}
                        {isWarrantyExpiring(asset.warrantyExpiresAt) ? 'expires' : 'valid until'}{' '}
                        {formatDate(asset.warrantyExpiresAt)}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">No warranty date recorded</p>
                    )}
                    {nextPlan ? (
                      <p className="font-medium text-foreground">
                        Next planned care {formatDate(nextPlan.nextDueAt)}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">No preventive plan linked yet</p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">
                      Lifecycle controls are recorded in the home audit trail.
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          rounded="md"
                          isLoading={
                            updateAssetStatus.isPending &&
                            updateAssetStatus.variables?.assetId === asset.id
                          }
                          icon={<MoreHorizontal className="h-4 w-4" />}
                        >
                          Lifecycle
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                          Update asset status
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {lifecycleActions[asset.status].map((action) => {
                          const Icon = action.icon;
                          return (
                            <DropdownMenuItem
                              key={action.status}
                              disabled={updateAssetStatus.isPending}
                              className={
                                action.destructive
                                  ? 'text-destructive focus:text-destructive'
                                  : undefined
                              }
                              onSelect={() =>
                                updateAssetStatus.mutate({
                                  assetId: asset.id,
                                  status: action.status,
                                })
                              }
                            >
                              <Icon className="h-4 w-4" />
                              {action.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={submitAsset} className="p-6">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Add an asset
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Add the essential information needed to protect, service, and account for this asset.
            </DialogDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Property" required>
                <Select
                  ariaLabel="Asset property"
                  value={form.propertyId}
                  onValueChange={(propertyId) =>
                    setForm((current) => ({
                      ...current,
                      propertyId,
                      unitId: '',
                    }))
                  }
                  placeholder="Select a property"
                  options={properties.map((property) => ({
                    value: property.id,
                    label: propertyLabel(property),
                  }))}
                />
              </Field>
              <Field
                label="Unit"
                hint={
                  !form.propertyId
                    ? 'Choose a property first.'
                    : unitsQuery.isLoading
                      ? 'Loading units. You can keep this as common-area equipment.'
                      : unitsQuery.isError
                        ? 'Units could not be loaded. You can still record common-area equipment.'
                        : units.length === 0
                          ? 'No units found. This asset will be recorded as common-area equipment.'
                          : 'Optional. Leave as common area for shared building equipment.'
                }
              >
                <Select
                  ariaLabel="Asset unit"
                  value={form.unitId}
                  disabled={!form.propertyId}
                  placeholder={
                    !form.propertyId ? 'Choose a property first' : 'Common area / no unit'
                  }
                  onValueChange={(unitId) => setForm((current) => ({ ...current, unitId }))}
                  options={[
                    { value: '', label: 'Common area / no unit' },
                    ...units.map((unit) => ({ value: unit.id, label: unit.unitName })),
                  ]}
                />
              </Field>
              <Field label="Asset name" htmlFor="asset-name" required>
                <Input
                  id="asset-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="e.g. Main inverter"
                />
              </Field>
              <Field label="Category" htmlFor="asset-category" required>
                <Input
                  id="asset-category"
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value }))
                  }
                  placeholder="e.g. Power, HVAC, appliance"
                />
              </Field>
              <Field label="Manufacturer" htmlFor="asset-manufacturer">
                <Input
                  id="asset-manufacturer"
                  value={form.manufacturer}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, manufacturer: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </Field>
              <Field label="Model number" htmlFor="asset-model-number">
                <Input
                  id="asset-model-number"
                  value={form.modelNumber}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, modelNumber: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </Field>
              <Field label="Serial number" htmlFor="asset-serial-number">
                <Input
                  id="asset-serial-number"
                  value={form.serialNumber}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, serialNumber: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </Field>
              <Field label="Installed on">
                <DatePicker
                  value={form.installedAt}
                  onChange={(value) => setForm((current) => ({ ...current, installedAt: value }))}
                />
              </Field>
              <Field label="Warranty expires">
                <DatePicker
                  value={form.warrantyExpiresAt}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, warrantyExpiresAt: value }))
                  }
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <Button
                type="button"
                variant="outline"
                rounded="md"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={createAsset.isPending}
                disabled={!form.propertyId || !form.name.trim() || !form.category.trim()}
              >
                Add asset
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </section>
  );
}

function AssetSummary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function AssetDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function AssetLoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
      ))}
    </div>
  );
}
