'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle2,
  Clock,
  Home,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Unlink,
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, NumberInput, Select, Toast, type ToastVariant } from '@getrentos/ui';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { ListingMediaPanel } from '@/components/estate/marketplace/ListingMediaPanel';
import { estateMarketplaceService } from '@/services/estateMarketplaceService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { EstateAgreement, EstateListing, EstateListingType } from '@/types/estate-marketplace';
import { usePlanTier } from '@/hooks/usePlanTier';

const statusBadge = (status: EstateAgreement['status']) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success">Can market</Badge>;
    case 'PENDING':
      return <Badge variant="warning">Awaiting owner</Badge>;
    case 'DECLINED':
      return <Badge variant="neutral">Declined</Badge>;
    default:
      return <Badge variant="danger">Revoked</Badge>;
  }
};

const listingStatusBadge = (status: EstateListing['status']) => {
  switch (status) {
    case 'PUBLISHED':
      return <Badge variant="success">Live</Badge>;
    case 'PAUSED':
      return <Badge variant="warning">Paused</Badge>;
    case 'CLOSED':
      return <Badge variant="neutral">Closed</Badge>;
    default:
      return <Badge variant="info">Draft</Badge>;
  }
};

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

const StatTile = ({ label, value, hint }: { label: string; value: number; hint?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </div>
);

/**
 * Add a property to the estate.
 *
 * Two steps on purpose, and the UI says so: bringing a property in makes it
 * findable under the estate, while asking the owner for marketing rights is a
 * separate request that only they can grant.
 */
const AddPropertyPanel = ({ estateId, onDone }: { estateId: string; onDone: () => void }) => {
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const candidates = useQuery({
    queryKey: ['estate', estateId, 'marketplace', 'candidates', search],
    queryFn: () => unwrap(estateMarketplaceService.listPropertyCandidates(estateId, search)),
    enabled: search.trim().length >= 3,
  });

  const request = useMutation({
    mutationFn: (propertyId: string) =>
      unwrap(estateMarketplaceService.requestAgreement(estateId, { propertyId, note: note.trim() || undefined })),
    onSuccess: (agreement) => {
      setToast({
        message:
          agreement.status === 'ACTIVE'
            ? 'Added — this estate owns the property, so it can market it straight away.'
            : 'Added, and the owner has been asked for marketing rights.',
        variant: 'success',
      });
      setSearch('');
      setNote('');
      onDone();
    },
    onError: (err: Error) =>
      setToast({ message: err.message || 'That property could not be added.', variant: 'error' }),
  });

  return (
    <div className="border-t border-border pt-4 space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="estate-property-search">
          Find the property
        </label>
        <Input
          id="estate-property-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by street, area or title — e.g. Alexander Avenue"
          leadingIcon={<Search className="w-4 h-4" />}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Type at least three characters. Properties already in another estate are not shown.
        </p>
      </div>

      {search.trim().length >= 3 && (
        <div className="space-y-2">
          {candidates.isLoading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching…
            </p>
          ) : (candidates.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No matching property. The owner needs to register it on GetRentos first.
            </p>
          ) : (
            candidates.data!.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{candidate.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {candidate.address}, {candidate.city} · owner {candidate.ownerName}
                  </p>
                </div>
                {candidate.agreementStatus === 'ACTIVE' ? (
                  <Badge variant="success">Can market</Badge>
                ) : candidate.agreementStatus === 'PENDING' ? (
                  <Badge variant="warning">Awaiting owner</Badge>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => request.mutate(candidate.id)}
                    disabled={request.isPending}
                  >
                    {candidate.inThisEstate ? 'Ask to market' : 'Add & ask'}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional note for the owner, e.g. why you are asking"
      />

      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </div>
  );
};

/** Publish a listing for a property the estate is already cleared to market. */
const NewListingPanel = ({
  estateId,
  agreements,
  onDone,
}: {
  estateId: string;
  agreements: EstateAgreement[];
  onDone: () => void;
}) => {
  const [propertyId, setPropertyId] = useState('');
  const [listingType, setListingType] = useState<EstateListingType>('RENT');
  const [price, setPrice] = useState<number | string>('');
  const [availableFrom, setAvailableFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const marketable = agreements.filter((a) => a.effective);
  const needsAgreement = marketable.length === 0;
  const priceIsValid = Number(price) > 0;

  const create = useMutation({
    mutationFn: (publish: boolean) =>
      unwrap(
        estateMarketplaceService.createListing(estateId, {
          propertyId,
          listingType,
          price: Number(price),
          availableFrom,
          publish,
        }),
      ),
    onSuccess: (listing) => {
      setToast({
        message:
          listing.status === 'PUBLISHED'
            ? 'Published — it is live in the market and on the estate page.'
            : 'Saved as a draft. Publish it when you are ready.',
        variant: 'success',
      });
      setPrice('');
      onDone();
    },
    onError: (err: Error) =>
      setToast({ message: err.message || 'That listing could not be created.', variant: 'error' }),
  });

  if (needsAgreement) {
    return (
      <div className="border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          This estate has no property it is cleared to market yet. Add a property and wait for the
          owner to approve — then listings can be published here.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-4 space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="estate-listing-property">
          Property
        </label>
        <Select
          ariaLabel="Property"
          value={propertyId}
          onValueChange={(value) => setPropertyId(value)}
          options={[
            { value: '', label: 'Choose a property…' },
            ...marketable.map((agreement) => ({
              value: agreement.propertyId,
              label: `${agreement.propertyTitle} — ${agreement.propertyAddress}`,
            })),
          ]}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="estate-listing-type">
            Market
          </label>
          <Select
            ariaLabel="Market"
            value={listingType}
            onValueChange={(value) => setListingType(value as EstateListingType)}
            options={[
              { value: 'RENT', label: 'For rent' },
              { value: 'SALE', label: 'For sale' },
              { value: 'SHORTLET', label: 'Short let' },
            ]}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="estate-listing-price">
            {listingType === 'SHORTLET' ? 'Nightly rate' : 'Asking price'}
          </label>
          <NumberInput
            id="estate-listing-price"
            value={price}
            onValueChange={(value) => setPrice(value)}
          />
        </div>
      </div>

      <div className="max-w-56">
        <label className="text-sm font-medium text-foreground" htmlFor="estate-listing-available">
          Available from
        </label>
        <Input
          id="estate-listing-available"
          type="date"
          value={availableFrom}
          onChange={(event) => setAvailableFrom(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={!propertyId || !priceIsValid || create.isPending}
          onClick={() => create.mutate(false)}
        >
          Save as draft
        </Button>
        <Button
          variant="primary"
          disabled={!propertyId || !priceIsValid || create.isPending}
          onClick={() => create.mutate(true)}
        >
          {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Publish
        </Button>
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </div>
  );
};

export default function EstateMarketplacePage() {
  const { estate } = useSelectedEstate();
  const estateId = estate?.id ?? '';
  const queryClient = useQueryClient();
  const { isPro } = usePlanTier();

  const [showAdd, setShowAdd] = useState(false);
  const [showNewListing, setShowNewListing] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  /** Which listing's photo panel is open. One at a time — the list is long. */
  const [mediaListingId, setMediaListingId] = useState<string | null>(null);

  const inventory = useQuery({
    queryKey: estateKeys.inventory(estateId),
    queryFn: () => unwrap(estateMarketplaceService.getInventory(estateId)),
    enabled: Boolean(estateId),
  });

  const agreements = useQuery({
    queryKey: estateKeys.agreements(estateId),
    queryFn: () => unwrap(estateMarketplaceService.listAgreements(estateId)),
    enabled: Boolean(estateId),
  });

  const listings = useQuery({
    queryKey: estateKeys.estateListings(estateId),
    queryFn: () => unwrap(estateMarketplaceService.listListings(estateId, { pageSize: 50 })),
    enabled: Boolean(estateId),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: estateKeys.inventory(estateId) });
    void queryClient.invalidateQueries({ queryKey: estateKeys.agreements(estateId) });
    void queryClient.invalidateQueries({ queryKey: estateKeys.estateListings(estateId) });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PUBLISHED' | 'PAUSED' | 'CLOSED' }) =>
      unwrap(estateMarketplaceService.setListingStatus(estateId, id, status)),
    onSuccess: (listing) => {
      setToast({
        message:
          listing.status === 'PUBLISHED'
            ? 'Published to the market and the estate page.'
            : `Listing ${listing.status.toLowerCase()}.`,
        variant: 'success',
      });
      refresh();
    },
    onError: (err: Error) => setToast({ message: err.message, variant: 'error' }),
  });

  const detach = useMutation({
    mutationFn: (propertyId: string) =>
      unwrap(estateMarketplaceService.detachProperty(estateId, propertyId)),
    onSuccess: () => {
      setToast({ message: 'Property removed from the estate.', variant: 'success' });
      refresh();
    },
    onError: (err: Error) => setToast({ message: err.message, variant: 'error' }),
  });

  const bulkPublish = useMutation({
    mutationFn: (ids: string[]) => unwrap(estateMarketplaceService.bulkPublish(estateId, ids)),
    onSuccess: (result) => {
      setToast({
        message:
          result.skipped.length === 0
            ? `${result.published} listings published.`
            : `${result.published} published, ${result.skipped.length} skipped: ${result.skipped[0]?.reason ?? ''}`,
        variant: result.skipped.length === 0 ? 'success' : 'warning',
      });
      refresh();
    },
    onError: (err: Error) => setToast({ message: err.message, variant: 'error' }),
  });

  if (!estateId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <EmptyState
          icon={Building2}
          title="No estate selected"
          description="Choose an estate from the switcher to manage its marketplace."
        />
      </div>
    );
  }

  const summary = inventory.data;
  const agreementRows = agreements.data ?? [];
  const listingRows = listings.data?.items ?? [];
  const drafts = listingRows.filter((l) => l.status === 'DRAFT' || l.status === 'PENDING_VERIFICATION');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Advertise the properties inside {estate?.name}. Owners keep their property; this estate
          gains the right to market it.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Properties" value={summary?.properties ?? 0} />
        <StatTile
          label="Awaiting owner"
          value={summary?.agreementsPending ?? 0}
          hint={summary?.agreementsPending ? 'These block new listings' : undefined}
        />
        <StatTile label="Cleared to market" value={summary?.agreementsActive ?? 0} />
        <StatTile label="Live listings" value={summary?.listingsPublished ?? 0} />
      </div>

      <Card static>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Properties and permissions
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                An owner must agree before this estate can publish a listing for their property.
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowAdd((open) => !open)}>
              <Plus className="w-4 h-4" />
              {showAdd ? 'Close' : 'Add a property'}
            </Button>
          </div>

          {showAdd && <AddPropertyPanel estateId={estateId} onDone={refresh} />}

          <div className="mt-5 space-y-2">
            {agreements.isLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </p>
            ) : agreementRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No properties yet. Add one to start advertising inside this estate.
              </p>
            ) : (
              agreementRows.map((agreement) => (
                <div
                  key={agreement.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {agreement.propertyTitle}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {agreement.propertyAddress}, {agreement.propertyCity} ·{' '}
                      {agreement.estateListingCount} listing
                      {agreement.estateListingCount === 1 ? '' : 's'}
                      {agreement.expiresAt
                        ? ` · until ${new Date(agreement.expiresAt).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {agreement.status === 'ACTIVE' ? (
                      <Badge variant="success">Can market</Badge>
                    ) : (
                      statusBadge(agreement.status)
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => detach.mutate(agreement.propertyId)}
                      disabled={detach.isPending}
                      title="Remove from this estate"
                    >
                      <Unlink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <Card static>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Home className="w-4 h-4 text-primary" />
                Listings
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Everything this estate is advertising, and everything still in draft.
              </p>
            </div>
            <div className="flex gap-2">
              {drafts.length > 1 && (
                <Button
                  variant="outline"
                  onClick={() => bulkPublish.mutate(drafts.map((d) => d.id))}
                  disabled={bulkPublish.isPending}
                  title={
                    isPro
                      ? 'Publish every draft at once (Enterprise)'
                      : 'Bulk publishing is an Enterprise feature'
                  }
                >
                  {bulkPublish.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Publish all drafts
                </Button>
              )}
              <Button variant="primary" onClick={() => setShowNewListing((open) => !open)}>
                <Plus className="w-4 h-4" />
                {showNewListing ? 'Close' : 'New listing'}
              </Button>
            </div>
          </div>

          {showNewListing && (
            <NewListingPanel
              estateId={estateId}
              agreements={agreementRows}
              onDone={refresh}
            />
          )}

          <div className="mt-5 space-y-2">
            {listings.isLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </p>
            ) : listingRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing advertised yet. Create a listing once a property is cleared to market.
              </p>
            ) : (
              listingRows.map((listing) => (
                <div key={listing.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {listing.listingTitle || listing.propertyTitle}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {listing.listingType === 'RENT'
                          ? 'For rent'
                          : listing.listingType === 'SALE'
                            ? 'For sale'
                            : 'Short let'}{' '}
                        · {formatNaira(listing.price)} · owner {listing.ownerName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {listingStatusBadge(listing.status)}
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setMediaListingId((current) => (current === listing.id ? null : listing.id))
                        }
                      >
                        <ImagePlus className="w-4 h-4" />
                        {listing.media?.length ? `Photos (${listing.media.length})` : 'Photos'}
                      </Button>
                      {listing.status === 'PUBLISHED' ? (
                        <Button
                          variant="ghost"
                          onClick={() => setStatus.mutate({ id: listing.id, status: 'PAUSED' })}
                        >
                          <Clock className="w-4 h-4" />
                          Pause
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setStatus.mutate({ id: listing.id, status: 'PUBLISHED' })}
                          disabled={setStatus.isPending}
                        >
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                  {mediaListingId === listing.id && (
                    <ListingMediaPanel estateId={estateId} listing={listing} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </div>
  );
}
