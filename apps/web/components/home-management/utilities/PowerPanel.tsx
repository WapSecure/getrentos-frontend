'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gauge, Plus, Power, Zap } from '@sureground/icons';
import {
  METER_SCOPE_LABELS,
  METER_TYPE_LABELS,
  bandCheck,
  discoLabel,
  formatCurrency,
  formatLitres,
  generatorServiceLabel,
  maskMeterNumber,
  type ElectricityMeter,
  type GeneratorServiceState,
  type UtilityGenerator,
  type UtilityPurchaseKind,
} from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ReasonDialog,
  Skeleton,
  useToast,
  type BadgeVariant,
} from '@sureground/ui';
import { HomeManagementSectionHeading } from '@/components/home-management/HomeManagementSectionHeading';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import type { HomeManagementProperty } from '@/services/homeManagementService';
import { utilitiesService } from '@/services/utilitiesService';
import {
  GeneratorProfileDialog,
  GeneratorServiceDialog,
  HourReadingDialog,
} from './GeneratorDialogs';
import { MeterDialog, MeterRevealButton, SupplyHoursDialog } from './MeterDialogs';
import { UtilityPurchaseDialog } from './UtilityPurchaseDialog';
import { UtilityPurchaseList } from './UtilityPurchaseList';

const SERVICE_BADGE: Record<GeneratorServiceState, { label: string; variant: BadgeVariant }> = {
  DUE: { label: 'Service due', variant: 'danger' },
  DUE_SOON: { label: 'Due soon', variant: 'warning' },
  OK: { label: 'On track', variant: 'success' },
  NO_BASELINE: { label: 'No service recorded', variant: 'neutral' },
  NOT_SCHEDULED: { label: 'No interval set', variant: 'neutral' },
};

interface PowerPanelProps {
  propertyId?: string;
  properties: HomeManagementProperty[];
  /** Field agents record readings and purchases; set-up actions are hidden for them. */
  recordOnly?: boolean;
  openPurchase: { kinds: UtilityPurchaseKind[] } | null;
  onOpenPurchaseChange: (value: { kinds: UtilityPurchaseKind[] } | null) => void;
  meterDialogOpen: boolean;
  onMeterDialogChange: (open: boolean) => void;
}

export function PowerPanel({
  propertyId,
  properties,
  recordOnly = false,
  openPurchase,
  onOpenPurchaseChange,
  meterDialogOpen,
  onMeterDialogChange,
}: PowerPanelProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [hoursFor, setHoursFor] = useState<UtilityGenerator | null>(null);
  const [profileFor, setProfileFor] = useState<UtilityGenerator | null>(null);
  const [serviceFor, setServiceFor] = useState<UtilityGenerator | null>(null);
  const [supplyFor, setSupplyFor] = useState<ElectricityMeter | null>(null);
  const [retiring, setRetiring] = useState<ElectricityMeter | null>(null);
  const [purchaseDefaults, setPurchaseDefaults] = useState<{
    generatorId?: string;
    meterId?: string;
  }>({});

  const generators = useQuery({
    queryKey: homeManagementKeys.utilities.generators(propertyId),
    queryFn: () => unwrap(utilitiesService.listGenerators(propertyId)),
  });
  const meters = useQuery({
    queryKey: homeManagementKeys.utilities.meters(propertyId),
    queryFn: () => unwrap(utilitiesService.listMeters(propertyId)),
  });
  const retire = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(utilitiesService.retireMeter(id, reason)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
      toast.success('Meter retired. Its history is kept.');
    },
  });

  const startPurchase = (kinds: UtilityPurchaseKind[], defaults: typeof purchaseDefaults = {}) => {
    setPurchaseDefaults(defaults);
    onOpenPurchaseChange({ kinds });
  };

  return (
    <div className="space-y-10">
      <section aria-labelledby="generators-heading">
        <HomeManagementSectionHeading
          id="generators-heading"
          title="Generators"
          description="Running hours, fuel and when each set is due a service."
          actions={
            <Button
              rounded="md"
              icon={<Plus className="h-4 w-4" />}
              disabled={properties.length === 0}
              onClick={() => startPurchase(['FUEL'])}
            >
              Log fuel
            </Button>
          }
        />
        <div className="mt-5">
          {generators.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-52 rounded-2xl" />
              <Skeleton className="h-52 rounded-2xl" />
            </div>
          ) : generators.isError ? (
            <EmptyState
              icon={Power}
              title="Generators could not be loaded"
              description="Refresh the page to try again."
            />
          ) : (generators.data ?? []).length === 0 ? (
            <EmptyState
              icon={Power}
              title="No generators yet"
              description="Add the generator under Assets and set its utility type to Generator. Its hours, fuel and service then show here."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(generators.data ?? []).map((generator) => (
                <GeneratorCard
                  key={generator.id}
                  generator={generator}
                  canOperate={generator.canOperate && !recordOnly}
                  onLogHours={() => setHoursFor(generator)}
                  onLogFuel={() => startPurchase(['FUEL'], { generatorId: generator.id })}
                  onEditProfile={() => setProfileFor(generator)}
                  onRecordService={() => setServiceFor(generator)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="meters-heading">
        <HomeManagementSectionHeading
          id="meters-heading"
          title="Electricity meters"
          description="Meter numbers show their last 4 digits only. Log daily supply to compare it with the band."
          actions={
            <>
              <Button
                variant="outline"
                rounded="md"
                disabled={properties.length === 0}
                onClick={() => startPurchase(['ELECTRICITY_TOKEN', 'ELECTRICITY_BILL'])}
              >
                Record electricity
              </Button>
              {!recordOnly && (
                <Button
                  rounded="md"
                  icon={<Plus className="h-4 w-4" />}
                  disabled={properties.length === 0}
                  onClick={() => onMeterDialogChange(true)}
                >
                  Add meter
                </Button>
              )}
            </>
          }
        />
        <div className="mt-5">
          {meters.isLoading ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : meters.isError ? (
            <EmptyState
              icon={Zap}
              title="Meters could not be loaded"
              description="Refresh the page to try again."
            />
          ) : (meters.data ?? []).length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No meters yet"
              description={
                recordOnly
                  ? 'The owner or managing agency adds meters.'
                  : 'Add each prepaid or postpaid meter to track tokens, bills and supply.'
              }
            />
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {(meters.data ?? []).map((meter) => (
                <MeterRow
                  key={meter.id}
                  meter={meter}
                  canOperate={!!meter.canOperate && !recordOnly}
                  onLogSupply={() => setSupplyFor(meter)}
                  onBuy={() =>
                    startPurchase(
                      meter.meterType === 'PREPAID' ? ['ELECTRICITY_TOKEN'] : ['ELECTRICITY_BILL'],
                      { meterId: meter.id }
                    )
                  }
                  onRetire={() => setRetiring(meter)}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="power-purchases-heading" className="space-y-4">
        <HomeManagementSectionHeading
          id="power-purchases-heading"
          title="Fuel and electricity bought"
          description="Newest first. Voided entries stay on the record with their reason."
        />
        <UtilityPurchaseList
          propertyId={propertyId}
          kinds={['FUEL', 'ELECTRICITY_TOKEN', 'ELECTRICITY_BILL']}
          caption="Fuel, electricity tokens and bills"
          emptyTitle="Nothing recorded yet"
          emptyDescription="Log diesel, petrol, tokens and bills as they are bought, with the receipt."
        />
      </section>

      <UtilityPurchaseDialog
        open={!!openPurchase}
        onOpenChange={(open) => !open && onOpenPurchaseChange(null)}
        properties={properties}
        defaultPropertyId={propertyId}
        kinds={openPurchase?.kinds ?? ['FUEL']}
        defaultGeneratorId={purchaseDefaults.generatorId}
        defaultMeterId={purchaseDefaults.meterId}
      />
      <MeterDialog
        open={meterDialogOpen}
        onOpenChange={onMeterDialogChange}
        properties={properties}
        defaultPropertyId={propertyId}
      />
      <HourReadingDialog generator={hoursFor} onOpenChange={(open) => !open && setHoursFor(null)} />
      <GeneratorProfileDialog
        generator={profileFor}
        onOpenChange={(open) => !open && setProfileFor(null)}
      />
      <GeneratorServiceDialog
        generator={serviceFor}
        onOpenChange={(open) => !open && setServiceFor(null)}
      />
      <SupplyHoursDialog meter={supplyFor} onOpenChange={(open) => !open && setSupplyFor(null)} />
      <ReasonDialog
        open={!!retiring}
        onOpenChange={(open) => !open && setRetiring(null)}
        title="Retire this meter"
        description="Use this when a meter is replaced or removed. Its tokens, bills and supply stay on the record."
        reasonLabel="Why is it being retired?"
        reasonPlaceholder="e.g. Replaced by the DisCo"
        minLength={3}
        maxLength={500}
        confirmLabel="Retire meter"
        tone="danger"
        error={retire.error?.message}
        onSubmit={({ reason }) =>
          retire.mutateAsync({ id: retiring!.id, reason }).then(() => setRetiring(null))
        }
      />
    </div>
  );
}

function GeneratorCard({
  generator,
  canOperate,
  onLogHours,
  onLogFuel,
  onEditProfile,
  onRecordService,
}: {
  generator: UtilityGenerator;
  canOperate: boolean;
  onLogHours: () => void;
  onLogFuel: () => void;
  onEditProfile: () => void;
  onRecordService: () => void;
}) {
  const badge = SERVICE_BADGE[generator.service.state];
  const latest = generator.service.latestReading;
  const profile = generator.profile;
  return (
    <Card className="flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">{generator.name}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {[generator.property.title, generator.unit?.name].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <p className="text-sm text-foreground">{generatorServiceLabel(generator.service)}</p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Hour meter</dt>
          <dd className="font-medium text-foreground">
            {latest ? `${latest.hourMeter} hours` : 'No reading yet'}
          </dd>
          {latest && <dd className="text-xs text-muted-foreground">{formatDate(latest.readAt)}</dd>}
        </div>
        <div>
          <dt className="text-muted-foreground">Last fuel</dt>
          <dd className="font-medium text-foreground">
            {generator.lastFuel
              ? [formatLitres(generator.lastFuel.litres), formatCurrency(generator.lastFuel.amount)]
                  .filter(Boolean)
                  .join(', ')
              : 'None logged'}
          </dd>
          {generator.lastFuel && (
            <dd className="text-xs text-muted-foreground">
              {formatDate(generator.lastFuel.occurredAt)}
            </dd>
          )}
        </div>
        {profile && (
          <div className="col-span-2 text-xs text-muted-foreground">
            {[
              profile.ratedKva ? `${profile.ratedKva} kVA` : null,
              profile.serviceIntervalHours
                ? `service every ${profile.serviceIntervalHours} hours`
                : null,
              profile.serviceIntervalDays ? `or ${profile.serviceIntervalDays} days` : null,
              profile.lastServiceAt ? `last serviced ${formatDate(profile.lastServiceAt)}` : null,
            ]
              .filter(Boolean)
              .join(', ')}
          </div>
        )}
      </dl>
      <div className="mt-auto flex flex-wrap gap-2">
        <Button size="sm" rounded="md" icon={<Gauge className="h-4 w-4" />} onClick={onLogHours}>
          Log hours
        </Button>
        <Button size="sm" variant="outline" rounded="md" onClick={onLogFuel}>
          Log fuel
        </Button>
        {canOperate && (
          <>
            <Button size="sm" variant="outline" rounded="md" onClick={onRecordService}>
              Record service
            </Button>
            <Button size="sm" variant="ghost" rounded="md" onClick={onEditProfile}>
              {profile ? 'Edit details' : 'Set service interval'}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

function MeterRow({
  meter,
  canOperate,
  onLogSupply,
  onBuy,
  onRetire,
}: {
  meter: ElectricityMeter;
  canOperate: boolean;
  onLogSupply: () => void;
  onBuy: () => void;
  onRetire: () => void;
}) {
  const check = bandCheck(meter.supplyLast30Days?.averageHours, meter.tariffBand);
  const name = meter.label || meter.unit?.name || METER_SCOPE_LABELS[meter.scope];
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-foreground">
          {name}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {meter.property?.title}
          </span>
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <span>{discoLabel(meter.disco, meter.discoOther)}</span>
          <span aria-hidden="true">·</span>
          <span>{METER_TYPE_LABELS[meter.meterType]}</span>
          {meter.tariffBand && (
            <>
              <span aria-hidden="true">·</span>
              <span>Band {meter.tariffBand}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{maskMeterNumber(meter.meterNumberLast4)}</span>
          {canOperate && <MeterRevealButton meter={meter} />}
        </p>
        <p
          className={
            check.status === 'BELOW' ? 'text-sm text-warning' : 'text-sm text-muted-foreground'
          }
        >
          Last 30 days: {check.message}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button size="sm" variant="outline" rounded="md" onClick={onLogSupply}>
          Log supply
        </Button>
        <Button size="sm" variant="outline" rounded="md" onClick={onBuy}>
          {meter.meterType === 'PREPAID' ? 'Record token' : 'Record bill'}
        </Button>
        {canOperate && (
          <Button size="sm" variant="ghost" rounded="md" onClick={onRetire}>
            Retire
          </Button>
        )}
      </div>
    </li>
  );
}
