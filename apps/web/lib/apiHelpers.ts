export * from '@getrentos/shared';

/** Standard server-side paginated response envelope. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
