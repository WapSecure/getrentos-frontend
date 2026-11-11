'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  LayoutGrid,
  Plus,
  Search,
  Send,
  Trash2,
} from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  ListSkeleton,
  PageHeader,
  SearchInput,
  Select,
  Switch,
  Textarea,
  useToast,
} from '@sureground/ui';
import { formatCurrency, unwrap } from '@sureground/shared';
import {
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_MARKET_LABEL,
  COLLECTION_MAX_ITEMS,
  COLLECTION_NOTE_MAX,
  COLLECTION_STATUS_LABEL,
  COLLECTION_TITLE_MAX,
  CURATOR_LABEL,
  cardSummary as toMarketCard,
  collectionPath,
  type CardMarket,
  type ManagedCollection,
  type MarketCard,
} from '@/types/collections';
import type { CollectionsManager } from '@/services/adminCollectionsService';

/** Paid placement is always labelled, wherever a collection shows. */
function SponsoredBadge() {
  return <Badge variant="warning">Sponsored</Badge>;
}

const MARKET_OPTIONS = (Object.keys(COLLECTION_MARKET_LABEL) as CardMarket[]).map((value) => ({
  value,
  label: COLLECTION_MARKET_LABEL[value],
}));

const STATUS_VARIANT = { DRAFT: 'neutral', PUBLISHED: 'success', ARCHIVED: 'warning' } as const;

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong. Try again.';

interface DraftItem {
  listingId: string;
  note: string;
  card: MarketCard | null;
  visible: boolean;
}

/**
 * List and edit one curator's collections. The server decides which listings are theirs to add;
 * the picker only offers those, and a refusal is shown as it comes back.
 */
export function AdminCollectionsView({
  manager,
  queryKey,
  title = 'Showroom collections',
  description = 'Curate sets of live listings across owners, and review what estates, agencies and realtors publish. Only Sureground collections can be sponsored.',
}: {
  manager: CollectionsManager;
  queryKey: readonly unknown[];
  title?: string;
  description?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const list = useQuery({ queryKey: [...queryKey, 'list'], queryFn: () => unwrap(manager.list()) });

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setCreating(true);
              setSelectedId(null);
            }}
          >
            New collection
          </Button>
        }
      />

      {creating && (
        <CreateCollectionForm
          manager={manager}
          onCancel={() => setCreating(false)}
          onCreated={(created) => {
            setCreating(false);
            setSelectedId(created.id);
            void list.refetch();
          }}
        />
      )}

      {list.isLoading ? (
        <ListSkeleton />
      ) : list.isError ? (
        <Alert variant="danger" title="Collections could not load">
          {errorMessage(list.error)}
        </Alert>
      ) : !list.data?.length && !creating ? (
        <EmptyState
          icon={LayoutGrid}
          title="No collections yet"
          description="A collection is a short, hand-picked set of live listings with a title and a note on each."
          action={
            <Button
              onClick={() => setCreating(true)}
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            >
              New collection
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <ul aria-label="Your collections" className="space-y-2">
            {(list.data ?? []).map((c) => (
              <li key={c.id}>
                <Button
                  variant={c.id === selectedId ? 'secondary' : 'ghost'}
                  className="h-auto w-full justify-start whitespace-normal py-3 text-left"
                  aria-current={c.id === selectedId ? 'true' : undefined}
                  onClick={() => {
                    setSelectedId(c.id);
                    setCreating(false);
                  }}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-medium text-foreground">{c.title}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant={STATUS_VARIANT[c.status]}>
                        {COLLECTION_STATUS_LABEL[c.status]}
                      </Badge>
                      {c.sponsored && <SponsoredBadge />}
                      {COLLECTION_MARKET_LABEL[c.market]} · {c.itemCount}{' '}
                      {c.itemCount === 1 ? 'listing' : 'listings'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {CURATOR_LABEL[c.curatorType]}
                      {c.curatorType !== 'STAFF' && c.curatorName ? `: ${c.curatorName}` : ''}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
          <div className="min-w-0">
            {selectedId ? (
              <CollectionEditor
                key={selectedId}
                manager={manager}
                id={selectedId}
                queryKey={queryKey}
                onChanged={() => void list.refetch()}
              />
            ) : (
              <Card className="p-6 text-sm text-muted-foreground">
                Choose a collection to edit its listings, order and details.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateCollectionForm({
  manager,
  onCancel,
  onCreated,
}: {
  manager: CollectionsManager;
  onCancel: () => void;
  onCreated: (c: ManagedCollection) => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [market, setMarket] = useState<CardMarket>('rent');
  const [sponsored, setSponsored] = useState(false);
  const create = useMutation({
    mutationFn: () =>
      unwrap(
        manager.create({
          title: title.trim(),
          description: description.trim() || undefined,
          market,
          sponsored,
        })
      ),
    onSuccess: (created) => {
      toast.success('Collection created as a draft');
      onCreated(created);
    },
  });

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-lg font-semibold">New collection</h2>
      <Field
        label="Title"
        required
        hint="Say what the listings have in common, for example “2-beds near Yaba”."
      >
        <Input
          value={title}
          maxLength={COLLECTION_TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>
      <Field label="Description" optionalLabel="Optional">
        <Textarea
          value={description}
          rows={3}
          maxLength={COLLECTION_DESCRIPTION_MAX}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Market" hint="A collection holds one kind of listing.">
        <Select
          value={market}
          onValueChange={(v) => setMarket(v as CardMarket)}
          options={MARKET_OPTIONS}
          searchable={false}
        />
      </Field>
      <Switch
        checked={sponsored}
        onCheckedChange={setSponsored}
        label="Sponsored"
        description="A paid placement. It is labelled “Sponsored” everywhere it shows."
      />
      {create.isError && <Alert variant="danger">{errorMessage(create.error)}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => create.mutate()}
          isLoading={create.isPending}
          disabled={title.trim().length < 3}
        >
          Create draft
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

function CollectionEditor({
  manager,
  id,
  queryKey,
  onChanged,
}: {
  manager: CollectionsManager;
  id: string;
  queryKey: readonly unknown[];
  onChanged: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const detailKey = [...queryKey, 'detail', id];
  const detail = useQuery({ queryKey: detailKey, queryFn: () => unwrap(manager.get(id)) });
  const collection = detail.data;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [sponsored, setSponsored] = useState(false);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [itemsDirty, setItemsDirty] = useState(false);

  // Reset the form whenever the server returns a newer version (React's "adjust state on prop change").
  const [syncedVersion, setSyncedVersion] = useState<string | null>(null);
  if (collection && syncedVersion !== collection.updatedAt + (collection.items?.length ?? '')) {
    setSyncedVersion(collection.updatedAt + (collection.items?.length ?? ''));
    setTitle(collection.title);
    setSponsored(collection.sponsored);
    setDescription(collection.description ?? '');
    setStartsAt(collection.startsAt?.slice(0, 10) ?? '');
    setEndsAt(collection.endsAt?.slice(0, 10) ?? '');
    setItems(
      (collection.items ?? []).map((i) => ({
        listingId: i.listingId,
        note: i.note ?? '',
        visible: i.visible,
        card: i.card ? toMarketCard(collection.market, i.card) : null,
      }))
    );
    setItemsDirty(false);
  }

  const refresh = (next: ManagedCollection) => {
    queryClient.setQueryData(detailKey, next);
    onChanged();
  };

  const saveDetails = useMutation({
    mutationFn: () =>
      unwrap(
        manager.update(id, {
          title: title.trim(),
          description: description.trim() || null,
          startsAt: startsAt ? new Date(`${startsAt}T00:00:00`).toISOString() : null,
          endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : null,
          ...(collection && sponsored !== collection.sponsored ? { sponsored } : {}),
        })
      ),
    onSuccess: (next) => {
      toast.success('Details saved');
      refresh({ ...next, items: collection?.items });
    },
  });
  const saveItems = useMutation({
    mutationFn: () =>
      unwrap(
        manager.setItems(
          id,
          items.map((i) => ({ listingId: i.listingId, note: i.note.trim() || undefined }))
        )
      ),
    onSuccess: (next) => {
      toast.success('Listings saved');
      refresh(next);
    },
  });
  const publish = useMutation({
    mutationFn: () => unwrap(manager.publish(id)),
    onSuccess: (next) => {
      toast.success('Collection published');
      refresh(next);
    },
  });
  const archive = useMutation({
    mutationFn: () => unwrap(manager.archive(id)),
    onSuccess: (next) => {
      toast.success('Collection archived');
      refresh(next);
    },
  });
  const setCover = useMutation({
    mutationFn: (listingId: string | null) =>
      unwrap(manager.update(id, { coverListingId: listingId })),
    onSuccess: (next) => refresh({ ...next, items: collection?.items }),
  });

  const move = (index: number, by: -1 | 1) => {
    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + by, 0, moved);
      return next;
    });
    setItemsDirty(true);
  };

  if (detail.isLoading) return <ListSkeleton />;
  if (detail.isError || !collection) {
    return <Alert variant="danger">{errorMessage(detail.error)}</Alert>;
  }

  const actionError = [saveDetails, saveItems, publish, archive, setCover].find(
    (m) => m.isError
  )?.error;
  const inCollection = new Set(items.map((i) => i.listingId));

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[collection.status]}>
            {COLLECTION_STATUS_LABEL[collection.status]}
          </Badge>
          {collection.sponsored && <SponsoredBadge />}
          <span className="text-sm text-muted-foreground">
            {COLLECTION_MARKET_LABEL[collection.market]}
          </span>
          {collection.status === 'PUBLISHED' && (
            <Button
              variant="link"
              size="sm"
              href={collectionPath(collection.slug)}
              target="_blank"
              icon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
            >
              View public page
            </Button>
          )}
        </div>
        <Field label="Title" required>
          <Input
            value={title}
            maxLength={COLLECTION_TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Description" optionalLabel="Optional">
          <Textarea
            value={description}
            rows={3}
            maxLength={COLLECTION_DESCRIPTION_MAX}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Show from" optionalLabel="Optional">
            <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </Field>
          <Field label="Show until" optionalLabel="Optional">
            <Input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </Field>
        </div>
        {(collection.curatorType === 'STAFF' || collection.sponsored) && (
          <Switch
            checked={sponsored}
            onCheckedChange={setSponsored}
            disabled={collection.curatorType !== 'STAFF' && !collection.sponsored}
            label="Sponsored"
            description={
              collection.curatorType === 'STAFF'
                ? 'A paid placement. It is labelled “Sponsored” everywhere it shows.'
                : 'Only Sureground collections can be sponsored; this flag can only be cleared here.'
            }
          />
        )}
        <p className="text-xs text-muted-foreground">
          Describe what the listings share. Words that suggest a check or a ranking, such as
          “verified” or “best”, are not accepted: each listing shows its own verification.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => saveDetails.mutate()}
            isLoading={saveDetails.isPending}
          >
            Save details
          </Button>
          {collection.status !== 'PUBLISHED' && (
            <Button
              icon={<Send className="h-4 w-4" aria-hidden="true" />}
              onClick={() => publish.mutate()}
              isLoading={publish.isPending}
              disabled={itemsDirty}
            >
              Publish
            </Button>
          )}
          {collection.status !== 'ARCHIVED' && (
            <Button
              variant="ghost"
              icon={<Archive className="h-4 w-4" aria-hidden="true" />}
              onClick={() => archive.mutate()}
              isLoading={archive.isPending}
            >
              Archive
            </Button>
          )}
        </div>
        {itemsDirty && collection.status !== 'PUBLISHED' && (
          <p className="text-xs text-muted-foreground">Save the listings before publishing.</p>
        )}
      </Card>

      {actionError ? <Alert variant="danger">{errorMessage(actionError)}</Alert> : null}

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Listings ({items.length}/{COLLECTION_MAX_ITEMS})
          </h2>
          <Button
            onClick={() => saveItems.mutate()}
            isLoading={saveItems.isPending}
            disabled={!itemsDirty}
          >
            Save listings
          </Button>
        </div>
        {!items.length ? (
          <p className="text-sm text-muted-foreground">Add listings from the search below.</p>
        ) : (
          <ol className="space-y-3">
            {items.map((item, index) => (
              <li key={item.listingId} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {index + 1}. {item.card?.title ?? 'Listing no longer live'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.card
                        ? [
                            item.card.location,
                            typeof item.card.price === 'number'
                              ? formatCurrency(item.card.price)
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')
                        : 'Hidden from the public page until it is live again.'}
                    </p>
                    {!item.visible && (
                      <Badge variant="warning" className="mt-1">
                        Not shown
                      </Badge>
                    )}
                    {collection.coverListingId === item.listingId && (
                      <Badge variant="info" className="mt-1">
                        Cover
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton
                      label={`Move ${item.card?.title ?? 'listing'} up`}
                      icon={<ArrowUp className="h-4 w-4" />}
                      size="sm"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    />
                    <IconButton
                      label={`Move ${item.card?.title ?? 'listing'} down`}
                      icon={<ArrowDown className="h-4 w-4" />}
                      size="sm"
                      variant="ghost"
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                    />
                    <IconButton
                      label={`Remove ${item.card?.title ?? 'listing'}`}
                      icon={<Trash2 className="h-4 w-4" />}
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setItems((c) => c.filter((x) => x.listingId !== item.listingId));
                        setItemsDirty(true);
                      }}
                    />
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <Field
                    label="Note"
                    optionalLabel="Optional"
                    hint="Shown on the card, e.g. “Quiet street, close to the school”."
                  >
                    <Input
                      value={item.note}
                      maxLength={COLLECTION_NOTE_MAX}
                      onChange={(e) => {
                        const note = e.target.value;
                        setItems((c) =>
                          c.map((x) => (x.listingId === item.listingId ? { ...x, note } : x))
                        );
                        setItemsDirty(true);
                      }}
                    />
                  </Field>
                  {collection.coverListingId !== item.listingId && item.card && !itemsDirty && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCover.mutate(item.listingId)}
                      isLoading={setCover.isPending && setCover.variables === item.listingId}
                    >
                      Use as cover
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <CandidatePicker
        manager={manager}
        market={collection.market}
        queryKey={queryKey}
        exclude={inCollection}
        full={items.length >= COLLECTION_MAX_ITEMS}
        onAdd={(card) => {
          setItems((c) => [...c, { listingId: card.id, note: '', card, visible: true }]);
          setItemsDirty(true);
        }}
      />
    </div>
  );
}

function CandidatePicker({
  manager,
  market,
  queryKey,
  exclude,
  full,
  onAdd,
}: {
  manager: CollectionsManager;
  market: CardMarket;
  queryKey: readonly unknown[];
  exclude: Set<string>;
  full: boolean;
  onAdd: (card: MarketCard) => void;
}) {
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSubmitted(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  const candidates = useQuery({
    queryKey: [...queryKey, 'candidates', market, submitted],
    queryFn: () => unwrap(manager.candidates(market, submitted || undefined)),
  });
  const cards = useMemo(
    () =>
      (candidates.data ?? [])
        .map((raw) => toMarketCard(market, raw))
        .filter((c) => !exclude.has(c.id)),
    [candidates.data, exclude, market]
  );

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-lg font-semibold">Add listings</h2>
      <SearchInput
        value={search}
        onValueChange={setSearch}
        placeholder="Search live listings by title, street or city"
        aria-label="Search listings to add"
      />
      {candidates.isLoading ? (
        <ListSkeleton />
      ) : candidates.isError ? (
        <Alert variant="danger">{errorMessage(candidates.error)}</Alert>
      ) : !cards.length ? (
        <EmptyState
          icon={Search}
          size="compact"
          title="No live listings to add"
          description={`Only live ${COLLECTION_MARKET_LABEL[market].toLowerCase()} can go in this collection. An estate, agency or realtor collection only takes that curator's own listings.`}
        />
      ) : (
        <ul className="divide-y divide-border">
          {cards.map((card) => (
            <li key={card.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground">
                  {[
                    card.location,
                    typeof card.price === 'number' ? formatCurrency(card.price) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                disabled={full}
                onClick={() => onAdd(card)}
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
