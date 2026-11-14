'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Droplets, ReceiptText, Zap } from '@sureground/icons';
import type { UtilityPurchaseKind } from '@sureground/shared';
import { SegmentedControl, Select } from '@sureground/ui';
import { useCreateRequest } from '@/components/home-management/HomeManagementSectionHeading';
import {
  UTILITIES_VIEW_PARAM,
  parseUtilitiesView,
  utilitiesViewHref,
  type UtilitiesCreateKind,
  type UtilitiesView,
} from '@/lib/homeManagementTabs';
import type { HomeManagementProperty } from '@/services/homeManagementService';
import { PowerPanel } from './PowerPanel';
import { ServiceChargePanel } from './ServiceChargePanel';
import { UtilitySpendPanel } from './UtilitySpendPanel';
import { WaterPanel, type WaterWorkOrderSeed } from './WaterPanel';
import { propertyName } from './utilityForm';

interface HomeManagementUtilitiesProps {
  properties: HomeManagementProperty[];
  /** Narrowed to one client's property in the agency custody view. */
  scopePropertyId?: string;
  /** A field agent: records readings and purchases, never set-up. */
  recordOnly?: boolean;
  createRequest?: { kind: UtilitiesCreateKind; id: number };
  onCreateRequestHandled?: () => void;
  onRaiseWorkOrder?: (from: WaterWorkOrderSeed) => void;
}

/** Power and water records for the homes in view. */
export function HomeManagementUtilities({
  properties,
  scopePropertyId,
  recordOnly = false,
  createRequest,
  onCreateRequestHandled,
  onRaiseWorkOrder,
}: HomeManagementUtilitiesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = parseUtilitiesView(searchParams.get(UTILITIES_VIEW_PARAM));
  const setView = (next: UtilitiesView) =>
    router.push(utilitiesViewHref(pathname, searchParams.toString(), next), { scroll: false });

  const [chosenPropertyId, setChosenPropertyId] = useState('');
  const propertyId = scopePropertyId ?? (chosenPropertyId || undefined);
  const [purchase, setPurchase] = useState<{ kinds: UtilityPurchaseKind[] } | null>(null);
  const [meterOpen, setMeterOpen] = useState(false);
  const [waterTestOpen, setWaterTestOpen] = useState(false);

  useCreateRequest(
    createRequest?.id,
    () => {
      // Dialog state only: navigation during render is not allowed, so the workspace sets the view.
      if (!createRequest) return;
      if (createRequest.kind === 'fuel') setPurchase({ kinds: ['FUEL'] });
      if (createRequest.kind === 'meter' && !recordOnly) setMeterOpen(true);
      if (createRequest.kind === 'water-test') setWaterTestOpen(true);
    },
    onCreateRequestHandled
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          aria-label="Utilities"
          className="[&_button]:whitespace-nowrap"
          value={view}
          onValueChange={setView}
          segments={[
            { value: 'power', label: 'Power', icon: <Zap className="h-4 w-4" /> },
            { value: 'water', label: 'Water', icon: <Droplets className="h-4 w-4" /> },
            // Budgets bill tenants, so field agents (record only) never see them.
            ...(recordOnly
              ? []
              : [
                  {
                    value: 'service-charge' as const,
                    label: 'Service charge',
                    icon: <ReceiptText className="h-4 w-4" />,
                  },
                ]),
            { value: 'spend', label: 'Spend', icon: <BarChart3 className="h-4 w-4" /> },
          ]}
        />
        {!scopePropertyId && properties.length > 1 && (
          <Select
            ariaLabel="Show utilities for"
            className="min-w-56"
            value={chosenPropertyId}
            onValueChange={setChosenPropertyId}
            options={[
              { value: '', label: 'All properties' },
              ...properties.map((property) => ({
                value: property.id,
                label: propertyName(property),
              })),
            ]}
          />
        )}
      </div>

      {view === 'service-charge' && !recordOnly ? (
        <ServiceChargePanel propertyId={propertyId} properties={properties} />
      ) : view === 'spend' ? (
        <UtilitySpendPanel
          propertyId={propertyId ?? (properties.length === 1 ? properties[0].id : undefined)}
        />
      ) : view === 'power' || view === 'service-charge' ? (
        <PowerPanel
          propertyId={propertyId}
          properties={properties}
          recordOnly={recordOnly}
          openPurchase={purchase}
          onOpenPurchaseChange={setPurchase}
          meterDialogOpen={meterOpen}
          onMeterDialogChange={setMeterOpen}
        />
      ) : (
        <WaterPanel
          propertyId={propertyId}
          properties={properties}
          recordOnly={recordOnly}
          openPurchase={purchase}
          onOpenPurchaseChange={setPurchase}
          waterTestOpen={waterTestOpen}
          onWaterTestChange={setWaterTestOpen}
          onRaiseWorkOrder={onRaiseWorkOrder}
        />
      )}
    </div>
  );
}
