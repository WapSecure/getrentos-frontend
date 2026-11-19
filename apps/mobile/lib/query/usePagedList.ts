import { useMemo } from 'react';
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';

interface Page<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

/** A list that loads page by page behind a "Show more" button, so nothing past the first page is out of reach. */
export function usePagedList<P extends Page<unknown>>(
  queryKey: QueryKey,
  fetchPage: (page: number) => Promise<P>,
  options: { enabled?: boolean } = {}
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: options.enabled,
  });
  const items = useMemo(
    () => (query.data?.pages.flatMap((p) => p.items) ?? []) as P['items'],
    [query.data]
  );
  return {
    query,
    items,
    total: query.data?.pages[0]?.total ?? 0,
    hasMore: query.hasNextPage,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
    isLoadingMore: query.isFetchingNextPage,
  };
}
