'use client';

import { Search } from 'lucide-react';
import { Input, Pagination, Select } from '@getrentos/ui';

interface PaginatedSelectProps<T> {
  value: string;
  onValueChange: (value: string) => void;
  items: T[];
  selectedItem?: T | null;
  getItemValue: (item: T) => string;
  getItemLabel: (item: T) => string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  placeholder: string;
  emptyOption?: { value: string; label: string };
  emptyMessage: string;
  isLoading?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * A selector backed by a server-paginated collection.
 *
 * It deliberately keeps fetching in the owning feature so the service and
 * query-key contracts remain explicit, while giving every operational picker
 * the same search and pagination affordances.
 */
export function PaginatedSelect<T>({
  value,
  onValueChange,
  items,
  selectedItem,
  getItemValue,
  getItemLabel,
  search,
  onSearchChange,
  searchPlaceholder,
  page,
  pageSize,
  total,
  onPageChange,
  placeholder,
  emptyOption,
  emptyMessage,
  isLoading = false,
  disabled = false,
  ariaLabel,
}: PaginatedSelectProps<T>) {
  const selectedItemIsVisible = selectedItem
    ? items.some((item) => getItemValue(item) === getItemValue(selectedItem))
    : false;
  const options = [
    ...(emptyOption ? [emptyOption] : []),
    ...(!selectedItemIsVisible && selectedItem
      ? [{ value: getItemValue(selectedItem), label: getItemLabel(selectedItem) }]
      : []),
    ...items.map((item) => ({ value: getItemValue(item), label: getItemLabel(item) })),
  ];

  return (
    <div className="space-y-2">
      <Input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        leadingIcon={<Search className="h-4 w-4" />}
        aria-label={`Search ${ariaLabel ?? placeholder}`}
        disabled={disabled}
      />
      <Select
        value={value}
        onValueChange={onValueChange}
        options={options}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        disabled={disabled || (isLoading && options.length === 0)}
      />
      {isLoading ? (
        <p className="px-1 text-xs text-muted-foreground">Loading options…</p>
      ) : total === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">{emptyMessage}</p>
      ) : (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          className="rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs"
        />
      )}
    </div>
  );
}
