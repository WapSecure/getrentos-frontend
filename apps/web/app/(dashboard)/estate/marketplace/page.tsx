'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle2,
  Clock,
  Home,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Unlink,
  X,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CurrencyInput,
  DatePicker,
  EmptyState,
  Field,
  IconButton,
  Input,
  ListSkeleton,
  NumberInput,
  Select,
  StatCard,
  StatGridSkeleton,
  useToast,
} from '@getrentos/ui';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { ListingMediaPanel } from '@/components/estate/marketplace/ListingMediaPanel';
import { estateMarketplaceService } from '@/services/estateMarketplaceService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { EstateAgreement, EstateListing, EstateListingType } from '@/types/estate-marketplace';
import { useEstatePlan } from '@/hooks/useEstatePlan';

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

/** Today as YYYY-MM-DD in the viewer's own calendar, not UTC's. */
const localToday = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

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
  const toast = useToast();

  const candidates = useQuery({
    queryKey: ['estate', estateId, 'marketplace', 'candidates', search],
    queryFn: () => unwrap(estateMarketplaceService.listPropertyCandidates(estateId, search)),
    enabled: search.trim().length >= 3,
    placeholderData: keepPreviousData,
  });

  const request = useMutation({
    mutationFn: (propertyId: string) =>
      unwrap(
        estateMarketplaceService.requestAgreement(estateId, {
          propertyId,
          note: note.trim() || undefined,
        })
      ),
    onSuccess: (agreement) => {
      toast.success(
        agreement.status === 'ACTIVE'
          ? 'Added: this estate owns the property, so it can market it straight away.'
          : 'Added, and the owner has been asked for marketing rights.'
      );
      setSearch('');
      setNote('');
      onDone();
    },
    onError: (err: Error) => toast.error(err.message || 'That property could not be added.'),
  });

  return (
    <div className="border-t border-border pt-4 space-y-4">
      <Field
        label="Find the property"
        htmlFor="estate-property-search"
        hint="Type at least three characters. Properties already in another estate are not shown."
      >
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by street, area or title: e.g. Alexander Avenue"
          leadingIcon={<Search className="w-4 h-4" />}
        />
      </Field>

      {search.trim().length >= 3 && (
        <div className="space-y-2">
          {candidates.isLoading ? (
            <ListSkeleton rows={2} label="Searching" />
          ) : (candidates.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No matching property. The owner needs to register it on GetRentos first.
            </p>
          ) : (
            candidates.data!.map((candidate) => (
              <div
                key={candidate.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
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
                    isLoading={request.isPending && request.variables === candidate.id}
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
        aria-label="Note for the owner"
      />
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
  const [availableFrom, setAvailableFrom] = useState(localToday);
  // A short let needs its own terms; the API refuses one without them.
  const [maxGuests, setMaxGuests] = useState<number | string>(2);
  const [minNights, setMinNights] = useState<number | string>(1);
  const [cleaningFee, setCleaningFee] = useState<number | string>('');
  const toast = useToast();

  const marketable = agreements.filter((a) => a.effective);
  const needsAgreement = marketable.length === 0;
  const shortlet = listingType === 'SHORTLET';
  const termsAreValid =
    !shortlet ||
    (Number.isInteger(Number(maxGuests)) &&
      Number(maxGuests) >= 1 &&
      Number.isInteger(Number(minNights)) &&
      Number(minNights) >= 1 &&
      (cleaningFee === '' || Number(cleaningFee) >= 0));
  const priceIsValid = Number(price) > 0 && termsAreValid;

  const create = useMutation({
    mutationFn: (publish: boolean) =>
      unwrap(
        estateMarketplaceService.createListing(estateId, {
          propertyId,
          listingType,
          price: Number(price),
          availableFrom,
          publish,
          ...(shortlet
            ? {
                shortlet: {
                  pricingMode: 'PER_NIGHT' as const,
                  nightlyRate: Number(price),
                  maxGuests: Number(maxGuests),
                  minNights: Number(minNights),
                  cleaningFee: cleaningFee === '' ? 0 : Number(cleaningFee),
                },
              }
            : {}),
        })
      ),
    onSuccess: (listing) => {
      toast.success(
        listing.status === 'PUBLISHED'
          ? 'Published: it is live in the market and on the estate page.'
          : 'Saved as a draft. Publish it when you are ready.'
      );
      setPrice('');
      onDone();
    },
    onError: (err: Error) => toast.error(err.message || 'That listing could not be created.'),
  });

  if (needsAgreement) {
    return (
      <div className="border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          This estate has no property it is cleared to market yet. Add a property and wait for the
          owner to approve: then listings can be published here.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-4 space-y-4">
      <Field label="Property" htmlFor="estate-listing-property">
        <Select
          value={propertyId}
          onValueChange={(value) => setPropertyId(value)}
          options={[
            { value: '', label: 'Choose a property…' },
            ...marketable.map((agreement) => ({
              value: agreement.propertyId,
              label: `${agreement.propertyTitle}: ${agreement.propertyAddress}`,
            })),
          ]}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Market" htmlFor="estate-listing-type">
          <Select
            value={listingType}
            onValueChange={(value) => setListingType(value as EstateListingType)}
            options={[
              { value: 'RENT', label: 'For rent' },
              { value: 'SALE', label: 'For sale' },
              { value: 'SHORTLET', label: 'Short let' },
            ]}
          />
        </Field>
        <Field
          label={listingType === 'SHORTLET' ? 'Nightly rate' : 'Asking price'}
          htmlFor="estate-listing-price"
        >
          <CurrencyInput prefix="₦" value={price} onValueChange={(value) => setPrice(value)} />
        </Field>
      </div>

      {shortlet ? (
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Guests, at most" htmlFor="estate-listing-guests">
            <NumberInput value={maxGuests} onValueChange={(value) => setMaxGuests(value)} />
          </Field>
          <Field label="Minimum nights" htmlFor="estate-listing-nights">
            <NumberInput value={minNights} onValueChange={(value) => setMinNights(value)} />
          </Field>
          <Field label="Cleaning fee" optionalLabel="(optional)" htmlFor="estate-listing-cleaning">
            <CurrencyInput
              prefix="₦"
              allowZero
              value={cleaningFee}
              onValueChange={(value) => setCleaningFee(value)}
            />
          </Field>
        </div>
      ) : null}

      <Field label="Available from" className="max-w-56">
        <DatePicker value={availableFrom} onChange={setAvailableFrom} min={localToday()} />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={!propertyId || !priceIsValid || create.isPending}
          isLoading={create.isPending && create.variables === false}
          onClick={() => create.mutate(false)}
        >
          Save as draft
        </Button>
        <Button
          variant="primary"
          icon={<Send className="w-4 h-4" />}
          disabled={!propertyId || !priceIsValid || create.isPending}
          isLoading={create.isPending && create.variables === true}
          onClick={() => create.mutate(true)}
        >
          Publish
        </Button>
      </div>
    </div>
  );
};

/** Change a listing's headline, price or start date without closing it. */
const EditListingPanel = ({
  estateId,
  listing,
  onDone,
}: {
  estateId: string;
  listing: EstateListing;
  onDone: () => void;
}) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(listing.listingTitle ?? '');
  const [price, setPrice] = useState<number | string>(listing.price);
  const [availableFrom, setAvailableFrom] = useState(
    listing.availableFrom
      ? listing.availableFrom.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        estateMarketplaceService.updateListing(estateId, listing.id, {
          ...(title.trim() && title.trim() !== (listing.listingTitle ?? '')
            ? { listingTitle: title.trim() }
            : {}),
          ...(Number(price) !== listing.price ? { price: Number(price) } : {}),
          ...(availableFrom !== listing.availableFrom?.slice(0, 10) ? { availableFrom } : {}),
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: estateKeys.estateListings(estateId) });
      onDone();
    },
    onError: (err: Error) => setError(err.message || 'That listing could not be changed.'),
  });

  return (
    <div className="rounded-xl border border-border p-3 space-y-3">
      <Field label="Headline" htmlFor={`edit-title-${listing.id}`}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field
          label={listing.listingType === 'SHORTLET' ? 'Nightly rate' : 'Asking price'}
          htmlFor={`edit-price-${listing.id}`}
        >
          <CurrencyInput prefix="₦" value={price} onValueChange={(value) => setPrice(value)} />
        </Field>
        <Field label="Available from">
          <DatePicker value={availableFrom} onChange={setAvailableFrom} />
        </Field>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={Number(price) <= 0}
          isLoading={save.isPending}
          onClick={() => {
            setError(null);
            save.mutate();
          }}
        >
          Save changes
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default function EstateMarketplacePage() {
  const { estate } = useSelectedEstate();
  const estateId = estate?.id ?? '';
  const queryClient = useQueryClient();
  const { isEnterprise } = useEstatePlan();

  const [showAdd, setShowAdd] = useState(false);
  const [showNewListing, setShowNewListing] = useState(false);
  const toast = useToast();
  /** Which listing's photo panel is open. One at a time: the list is long. */
  const [mediaListingId, setMediaListingId] = useState<string | null>(null);
  const [editListingId, setEditListingId] = useState<string | null>(null);

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
      toast.success(
        listing.status === 'PUBLISHED'
          ? 'Published to the market and the estate page.'
          : `Listing ${listing.status.toLowerCase()}.`
      );
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const detach = useMutation({
    mutationFn: (propertyId: string) =>
      unwrap(estateMarketplaceService.detachProperty(estateId, propertyId)),
    onSuccess: () => {
      toast.success('Property removed from the estate.');
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bulkPublish = useMutation({
    mutationFn: (ids: string[]) => unwrap(estateMarketplaceService.bulkPublish(estateId, ids)),
    onSuccess: (result) => {
      if (result.skipped.length === 0) {
        toast.success(`${result.published} listings published.`);
      } else {
        toast.warning(
          `${result.published} published, ${result.skipped.length} skipped: ${result.skipped[0]?.reason ?? ''}`
        );
      }
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
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
  const drafts = listingRows.filter(
    (l) => l.status === 'DRAFT' || l.status === 'PENDING_VERIFICATION'
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Advertise the properties inside {estate?.name}. Owners keep their property; this estate
          gains the right to market it.
        </p>
      </header>

      {inventory.isLoading ? (
        <StatGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Building2} label="Properties" value={summary?.properties ?? 0} />
          <StatCard
            icon={Clock}
            accent="orange"
            label="Awaiting owner"
            value={summary?.agreementsPending ?? 0}
            subtitle={summary?.agreementsPending ? 'These block new listings' : undefined}
          />
          <StatCard
            icon={ShieldCheck}
            accent="emerald"
            label="Cleared to market"
            value={summary?.agreementsActive ?? 0}
          />
          <StatCard
            icon={Home}
            accent="primary"
            label="Live listings"
            value={summary?.listingsPublished ?? 0}
          />
        </div>
      )}

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
            <Button
              variant="outline"
              icon={<Plus className="w-4 h-4" />}
              aria-expanded={showAdd}
              onClick={() => setShowAdd((open) => !open)}
            >
              {showAdd ? 'Close' : 'Add a property'}
            </Button>
          </div>

          {showAdd && <AddPropertyPanel estateId={estateId} onDone={refresh} />}

          <div className="mt-5 space-y-2">
            {agreements.isLoading ? (
              <ListSkeleton rows={3} />
            ) : agreementRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No properties yet. Add one to start advertising inside this estate.
              </p>
            ) : (
              agreementRows.map((agreement) => (
                <div
                  key={agreement.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
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
                    <IconButton
                      label={`Remove ${agreement.propertyTitle} from this estate`}
                      title="Remove from this estate"
                      icon={<Unlink />}
                      onClick={() => detach.mutate(agreement.propertyId)}
                      disabled={detach.isPending}
                      isLoading={detach.isPending && detach.variables === agreement.propertyId}
                    />
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
            <div className="flex flex-wrap gap-2">
              {drafts.length > 1 && (
                <Button
                  variant="outline"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => bulkPublish.mutate(drafts.map((d) => d.id))}
                  isLoading={bulkPublish.isPending}
                  title={
                    isEnterprise
                      ? 'Publish every draft at once (Enterprise)'
                      : 'Bulk publishing is an Enterprise feature'
                  }
                >
                  Publish all drafts
                </Button>
              )}
              <Button
                variant="primary"
                icon={showNewListing ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                aria-expanded={showNewListing}
                onClick={() => setShowNewListing((open) => !open)}
              >
                {showNewListing ? 'Close' : 'New listing'}
              </Button>
            </div>
          </div>

          {showNewListing && (
            <NewListingPanel estateId={estateId} agreements={agreementRows} onDone={refresh} />
          )}

          <div className="mt-5 space-y-2">
            {listings.isLoading ? (
              <ListSkeleton rows={3} />
            ) : listingRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing advertised yet. Create a listing once a property is cleared to market.
              </p>
            ) : (
              listingRows.map((listing) => (
                <div key={listing.id} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
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
                    <div className="flex flex-wrap items-center gap-2">
                      {listingStatusBadge(listing.status)}
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setMediaListingId((current) =>
                            current === listing.id ? null : listing.id
                          )
                        }
                      >
                        <ImagePlus className="w-4 h-4" />
                        {listing.media?.length ? `Photos (${listing.media.length})` : 'Photos'}
                      </Button>
                      {listing.status !== 'CLOSED' && (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setEditListingId((current) =>
                              current === listing.id ? null : listing.id
                            )
                          }
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                      )}
                      {listing.status === 'PUBLISHED' ? (
                        <Button
                          variant="ghost"
                          disabled={setStatus.isPending}
                          isLoading={setStatus.isPending && setStatus.variables?.id === listing.id}
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
                          isLoading={setStatus.isPending && setStatus.variables?.id === listing.id}
                        >
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                  {mediaListingId === listing.id && (
                    <ListingMediaPanel estateId={estateId} listing={listing} />
                  )}
                  {editListingId === listing.id && (
                    <EditListingPanel
                      estateId={estateId}
                      listing={listing}
                      onDone={() => setEditListingId(null)}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
