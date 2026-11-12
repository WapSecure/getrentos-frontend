'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search } from '@sureground/icons';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  CurrencyInput,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  NumberInput,
  Select,
  useToast,
} from '@sureground/ui';
import { formatCurrency, unwrap } from '@sureground/shared';
import type { CollectionsManager } from '@/services/adminCollectionsService';
import {
  COLLECTION_MARKET_LABEL,
  COLLECTION_MAX_ITEMS,
  RULE_DEFAULT_LIMIT,
  RULE_PROPERTY_TYPES,
  RULE_SORT_LABEL,
  cardSummary,
  type CollectionRule,
  type ManagedCollection,
  type RuleSort,
} from '@/types/collections';

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong. Try again.';

const SORT_OPTIONS = (Object.keys(RULE_SORT_LABEL) as RuleSort[]).map((value) => ({
  value,
  label: RULE_SORT_LABEL[value],
}));
const ANY = 'any';
const TYPE_OPTIONS = [{ value: ANY, label: 'Any type' }, ...RULE_PROPERTY_TYPES];
const ROOM_OPTIONS = [
  { value: ANY, label: 'Any' },
  ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}+` })),
];

interface RuleForm {
  search: string;
  city: string;
  state: string;
  area: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  furnished: boolean;
  verifiedOnly: boolean;
  sort: RuleSort;
  limit: string;
}

/** The web map's `area=` value: four numbers for a box, or six or more (lat,lng pairs) for a drawn shape. */
function areaToRule(
  area: string
): Pick<CollectionRule, 'minLat' | 'minLng' | 'maxLat' | 'maxLng' | 'polygon'> {
  const text = area.trim();
  if (!text) return {};
  const parts = text.split(',').map((p) => p.trim());
  if (parts.length === 4) {
    const [minLat, minLng, maxLat, maxLng] = parts.map(Number);
    return { minLat, minLng, maxLat, maxLng };
  }
  return { polygon: text };
}

function ruleToArea(rule: CollectionRule | null): string {
  if (!rule) return '';
  if (rule.polygon) return rule.polygon;
  const box = [rule.minLat, rule.minLng, rule.maxLat, rule.maxLng];
  return box.every((n) => typeof n === 'number') ? box.join(',') : '';
}

function fromRule(rule: CollectionRule | null): RuleForm {
  return {
    search: rule?.search ?? '',
    city: rule?.city ?? '',
    state: rule?.state ?? '',
    area: ruleToArea(rule),
    minPrice: rule?.minPrice ?? 0,
    maxPrice: rule?.maxPrice ?? 0,
    bedrooms: rule?.bedrooms != null ? String(rule.bedrooms) : ANY,
    bathrooms: rule?.bathrooms != null ? String(rule.bathrooms) : ANY,
    propertyType: rule?.propertyType ?? ANY,
    furnished: Boolean(rule?.furnished),
    verifiedOnly: Boolean(rule?.verifiedOnly),
    sort: rule?.sort ?? 'newest',
    limit: String(rule?.limit ?? RULE_DEFAULT_LIMIT),
  };
}

function toRule(form: RuleForm, market: ManagedCollection['market']): CollectionRule {
  const homes = market !== 'land';
  const limit = Number(form.limit);
  return {
    search: form.search.trim() || undefined,
    city: form.city.trim() || undefined,
    state: form.state.trim() || undefined,
    ...areaToRule(form.area),
    minPrice: form.minPrice || undefined,
    maxPrice: form.maxPrice || undefined,
    bedrooms: homes && form.bedrooms !== ANY ? Number(form.bedrooms) : undefined,
    bathrooms: homes && form.bathrooms !== ANY ? Number(form.bathrooms) : undefined,
    propertyType: homes && form.propertyType !== ANY ? form.propertyType : undefined,
    furnished: market === 'rent' && form.furnished ? true : undefined,
    verifiedOnly: homes && form.verifiedOnly ? true : undefined,
    sort: form.sort,
    limit:
      Number.isInteger(limit) && limit >= 1 ? Math.min(limit, COLLECTION_MAX_ITEMS) : undefined,
  };
}

const PRICE_HINT: Record<ManagedCollection['market'], string> = {
  rent: 'Yearly rent in naira. Monthly listings compare at 12 times their price.',
  sale: 'Asking price in naira.',
  land: 'Asking price in naira.',
  shortlet: 'Nightly rate in naira.',
};

/**
 * A rule-based collection: a saved public search. The public page runs it each time it loads, so it
 * only ever shows public listings, and leaves out listings their listers opted out of.
 */
export function RuleEditor({
  manager,
  collection,
  onSaved,
}: {
  manager: CollectionsManager;
  collection: ManagedCollection;
  onSaved: (next: ManagedCollection) => void;
}) {
  const toast = useToast();
  const market = collection.market;
  const homes = market !== 'land';
  const [form, setForm] = useState<RuleForm>(() => fromRule(collection.rule));
  const [dirty, setDirty] = useState(false);
  const set = <K extends keyof RuleForm>(key: K, value: RuleForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const rule = useMemo(() => toRule(form, market), [form, market]);
  const [debounced, setDebounced] = useState(rule);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(rule), 450);
    return () => clearTimeout(t);
  }, [rule]);

  const preview = useQuery({
    queryKey: ['admin', 'collections', 'rule-preview', collection.id, market, debounced],
    queryFn: () => unwrap(manager.previewRule(market, debounced, collection.id)),
    retry: false,
  });
  const save = useMutation({
    mutationFn: () => unwrap(manager.update(collection.id, { kind: 'rule', rule })),
    onSuccess: (next) => {
      toast.success('Rule saved');
      setDirty(false);
      onSaved(next);
    },
  });

  const cards = (preview.data?.items ?? []).map((raw) => cardSummary(market, raw));

  return (
    <Card className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Rule</h2>
        <Button onClick={() => save.mutate()} isLoading={save.isPending} disabled={!dirty}>
          Save rule
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        The same filters as the {COLLECTION_MARKET_LABEL[market].toLowerCase()} search. The public
        page runs them each time it loads, so it shows only live listings, never more than the
        limit, and none whose lister opted out.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City or area" optionalLabel="Optional">
          <Input value={form.city} maxLength={120} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="State" optionalLabel="Optional">
          <Input
            value={form.state}
            maxLength={120}
            onChange={(e) => set('state', e.target.value)}
          />
        </Field>
        <Field
          label="Map area"
          optionalLabel="Optional"
          hint="Paste the area= value from a map search link: four numbers for a box, or lat,lng pairs for a drawn shape."
          className="sm:col-span-2"
        >
          <Input value={form.area} onChange={(e) => set('area', e.target.value)} />
        </Field>
        <Field label="Keywords" optionalLabel="Optional" className="sm:col-span-2">
          <Input
            value={form.search}
            maxLength={120}
            onChange={(e) => set('search', e.target.value)}
          />
        </Field>
        <Field label="Lowest price" optionalLabel="Optional" hint={PRICE_HINT[market]}>
          <CurrencyInput
            prefix="₦"
            value={form.minPrice || ''}
            onValueChange={(v) => set('minPrice', v)}
          />
        </Field>
        <Field label="Highest price" optionalLabel="Optional">
          <CurrencyInput
            prefix="₦"
            value={form.maxPrice || ''}
            onValueChange={(v) => set('maxPrice', v)}
          />
        </Field>
        {homes && (
          <>
            <Field label="Bedrooms">
              <Select
                value={form.bedrooms}
                onValueChange={(v) => set('bedrooms', v)}
                options={ROOM_OPTIONS}
                searchable={false}
              />
            </Field>
            <Field label="Bathrooms">
              <Select
                value={form.bathrooms}
                onValueChange={(v) => set('bathrooms', v)}
                options={ROOM_OPTIONS}
                searchable={false}
              />
            </Field>
            <Field label="Property type">
              <Select
                value={form.propertyType}
                onValueChange={(v) => set('propertyType', v)}
                options={TYPE_OPTIONS}
                searchable={false}
              />
            </Field>
          </>
        )}
        <Field label="Order">
          <Select
            value={form.sort}
            onValueChange={(v) => set('sort', v as RuleSort)}
            options={SORT_OPTIONS}
            searchable={false}
          />
        </Field>
        <Field label="Show at most" hint={`1 to ${COLLECTION_MAX_ITEMS} listings.`}>
          <NumberInput integer value={form.limit} onValueChange={(v) => set('limit', v)} />
        </Field>
      </div>
      <div className="space-y-3">
        {market === 'rent' && (
          <Checkbox
            checked={form.furnished}
            onCheckedChange={(v) => set('furnished', v)}
            label="Furnished only"
          />
        )}
        {homes && (
          <Checkbox
            checked={form.verifiedOnly}
            onCheckedChange={(v) => set('verifiedOnly', v)}
            label="Only properties Sureground has verified"
            description="A filter on the check each listing already shows. The title still may not claim it."
          />
        )}
      </div>

      {save.isError && <Alert variant="danger">{errorMessage(save.error)}</Alert>}

      <div className="space-y-3 border-t border-border pt-4">
        <div aria-live="polite">
          {preview.isLoading ? (
            <p className="text-sm text-muted-foreground">Counting live listings…</p>
          ) : preview.isError ? (
            <Alert variant="warning" title="These filters can’t be used yet">
              {errorMessage(preview.error)}
            </Alert>
          ) : preview.data ? (
            <p className="text-sm font-medium text-foreground">
              {preview.data.count === 1
                ? '1 listing would show now'
                : `${preview.data.count} listings would show now`}
              <span className="font-normal text-muted-foreground">
                {' '}
                ({preview.data.matching} match the filters, limit {preview.data.limit})
              </span>
            </p>
          ) : null}
        </div>
        {preview.isLoading ? (
          <ListSkeleton />
        ) : preview.data && !cards.length ? (
          <EmptyState
            icon={Search}
            size="compact"
            title="No live listings match"
            description="Widen the filters. A rule-based collection with nothing to show can’t be published."
          />
        ) : (
          <ol className="divide-y divide-border">
            {cards.map((card, index) => (
              <li key={card.id} className="py-2 text-sm">
                <span className="font-medium text-foreground">
                  {index + 1}. {card.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {[
                    card.location,
                    typeof card.price === 'number' ? formatCurrency(card.price) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
