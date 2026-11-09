'use client';

import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles } from '@sureground/icons';
import { Button, Input, useToast } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { renterService } from '@/services/renterService';
import type { RentalSearchParse } from '@/types/searchParse';

export interface DiscoverFilterValues {
  location: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  verifiedOnly: boolean;
}

const NOT_FILTERED_HERE: [keyof RentalSearchParse['filters'], string][] = [
  ['furnished', 'furnished'],
  ['petsAllowed', 'pets allowed'],
  ['monthlyPayment', 'monthly payment'],
  ['sortBy', 'sorted as asked'],
];

// Anything the page cannot filter on is shown, not dropped.
export function PlainLanguageSearch({
  onApply,
}: {
  onApply: (filters: DiscoverFilterValues) => void;
}) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [result, setResult] = useState<RentalSearchParse | null>(null);

  const parse = useMutation({
    mutationFn: (query: string) => unwrap(renterService.parseSearch(query)),
    onSuccess: (r) => {
      setResult(r);
      const f = r.filters;
      onApply({
        location: f.location ?? f.state ?? '',
        minPrice: f.minPrice ? String(f.minPrice) : '',
        maxPrice: f.maxPrice ? String(f.maxPrice) : '',
        bedrooms: f.bedrooms ? String(f.bedrooms) : '',
        bathrooms: f.bathrooms ? String(f.bathrooms) : '',
        propertyType: f.propertyType ?? '',
        verifiedOnly: Boolean(f.verifiedOnly),
      });
    },
    onError: (e: Error) =>
      toast.error(e.message || 'Could not read that search. Try the filters instead.'),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim().length >= 2) parse.mutate(text.trim());
  };

  const unfiltered = result
    ? NOT_FILTERED_HERE.filter(([k]) => result.filters[k]).map(([, label]) => label)
    : [];
  const extras = [...unfiltered, ...(result?.notes ?? [])];

  return (
    <div className="space-y-2">
      <form
        onSubmit={submit}
        className="flex flex-col gap-2 sm:flex-row"
        role="search"
        aria-label="Describe the home you want"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe it: 3-bed in Lekki under ₦4m, verified landlord, near a school"
          aria-label="Describe the home you want"
          maxLength={300}
          className="flex-1"
        />
        <Button
          type="submit"
          className="gap-1.5 shrink-0"
          isLoading={parse.isPending}
          disabled={text.trim().length < 2}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Find homes
        </Button>
      </form>
      {result && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Showing: <span className="text-foreground">{result.summary.split(' (also:')[0]}</span>
          {extras.length > 0 && <> · Noted, not filtered: {extras.join(', ')}</>}
        </p>
      )}
    </div>
  );
}
