'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  PageErrorState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@getrentos/ui';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import { unwrap, unwrapOptional } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { LAND_DEVELOPER_ROUTES } from '@/lib/constants/landDeveloperRoutes';
import { landDeveloperService } from '@/services/landDeveloperService';
import type { OwnerLandRecord } from '@/types/land';
import type { LandLayoutInput, OwnerLandLayout } from '@/types/landDeveloper';
import { errorMessage, useNotify } from './feedback';
import { InventoryDashboard } from './InventoryDashboard';
import { LayoutForm } from './LayoutForm';
import { LayoutStatusPanel } from './LayoutStatusPanel';
import { PaymentPlans } from './PaymentPlans';
import { PlotInventory } from './PlotInventory';

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
  </div>
);

const LayoutDetails = ({ layout }: { layout: OwnerLandLayout }) => (
  <Card static className="p-5">
    <h2 className="text-base font-semibold text-foreground">Estate details</h2>
    {layout.description && (
      <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{layout.description}</p>
    )}
    <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Detail label="Layout approval" value={layout.layoutApprovalReference ?? 'Not recorded'} />
      <Detail
        label="Layout plan document"
        value={layout.layoutPlanDocumentId ? 'Attached' : 'Not attached'}
      />
      <Detail label="Reservation hold" value={`${layout.reservationHoldHours} hours`} />
      <Detail label="Documentation fee" value={formatCurrency(layout.fees.documentationFee)} />
      <Detail label="Survey fee" value={formatCurrency(layout.fees.surveyFee)} />
      <Detail label="Development levy" value={formatCurrency(layout.fees.developmentLevy)} />
    </dl>
  </Card>
);

/** Why a layout cannot be started yet, or the form that starts one. */
const LayoutSetup = ({
  record,
  notify,
}: {
  record: OwnerLandRecord;
  notify: ReturnType<typeof useNotify>['notify'];
}) => {
  const queryClient = useQueryClient();
  const propertyId = record.property.id;
  const create = useMutation({
    mutationFn: (input: LandLayoutInput) =>
      unwrap(landDeveloperService.createLayout(propertyId, input)),
    onSuccess: (layout) => {
      queryClient.setQueryData(landDeveloperKeys.layout(propertyId), layout);
      queryClient.invalidateQueries({ queryKey: landDeveloperKeys.layouts });
      queryClient.invalidateQueries({ queryKey: landDeveloperKeys.documents(propertyId) });
      notify('Estate layout created. Add plots and a payment plan next.');
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  const blocker = !record.parcel
    ? 'Add the master parcel details before creating a layout.'
    : !record.parcel.subdivisionAllowed
      ? 'This parcel is not marked as allowing subdivision. Turn on "Subdivision allowed" in the parcel record if the title permits it.'
      : null;

  return (
    <Card static className="p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LayoutGrid className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sell this land as plots</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Set up an estate layout to sell plots carved from this parcel, on outright or
            installment plans. GetRentos holds buyers&apos; payments and pays you as each conveyance
            step is confirmed.
          </p>
        </div>
      </div>
      {blocker ? (
        <div className="mt-5 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-foreground">
          <p>{blocker}</p>
          <Button
            href={LAND_DEVELOPER_ROUTES.portfolio(propertyId)}
            variant="outline"
            size="sm"
            rounded="lg"
            className="mt-3"
            iconPosition="right"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Open parcel record
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <LayoutForm
            propertyId={propertyId}
            isSaving={create.isPending}
            submitLabel="Create layout"
            onSubmit={(input) => create.mutate(input)}
          />
        </div>
      )}
    </Card>
  );
};

/** The developer's estate on one parcel: status, inventory, plots and payment plans. */
export const LayoutWorkspace = ({ record }: { record: OwnerLandRecord }) => {
  const queryClient = useQueryClient();
  const propertyId = record.property.id;
  const { notify, toast } = useNotify();
  const [editOpen, setEditOpen] = useState(false);

  const {
    data: layout,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: landDeveloperKeys.layout(propertyId),
    queryFn: () => unwrapOptional(landDeveloperService.getLayout(propertyId), null),
  });

  const update = useMutation({
    mutationFn: (input: LandLayoutInput) =>
      unwrap(landDeveloperService.updateLayout(propertyId, input)),
    onSuccess: (updated) => {
      queryClient.setQueryData(landDeveloperKeys.layout(propertyId), updated);
      queryClient.invalidateQueries({ queryKey: landDeveloperKeys.layouts });
      queryClient.invalidateQueries({ queryKey: landDeveloperKeys.documents(propertyId) });
      setEditOpen(false);
      notify('Estate details saved.');
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  let body: React.ReactNode;
  if (isLoading) {
    body = <div className="h-96 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  } else if (isError) {
    body = (
      <PageErrorState
        title="The estate layout could not be loaded"
        description={errorMessage(error)}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  } else if (!layout) {
    body = <LayoutSetup record={record} notify={notify} />;
  } else {
    body = (
      <div className="space-y-6">
        <LayoutStatusPanel
          record={record}
          layout={layout}
          onEdit={() => setEditOpen(true)}
          notify={notify}
        />
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plots">Plots</TabsTrigger>
            <TabsTrigger value="plans">Payment plans</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-5 space-y-6">
            <InventoryDashboard propertyId={propertyId} />
            <LayoutDetails layout={layout} />
          </TabsContent>
          <TabsContent value="plots" className="mt-5">
            <PlotInventory propertyId={propertyId} layoutStatus={layout.status} notify={notify} />
          </TabsContent>
          <TabsContent value="plans" className="mt-5">
            <PaymentPlans layout={layout} notify={notify} />
          </TabsContent>
        </Tabs>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogTitle className="mb-4 text-lg font-semibold text-foreground">
              Edit estate details
            </DialogTitle>
            <LayoutForm
              key={layout.id}
              propertyId={propertyId}
              layout={layout}
              isSaving={update.isPending}
              submitLabel="Save changes"
              onSubmit={(input) => update.mutate(input)}
              onCancel={() => setEditOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <>
      {body}
      {toast}
    </>
  );
};
