'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * A register's search box, seeded from `?search=` and re-seeded whenever that
 * parameter changes. A header-search result links to `/admin/<register>?search=…`;
 * when staff are already on that register the page does not remount, so reading
 * the URL only once would leave them on the old, unfiltered list.
 */
export function useAdminSearchParam(): [string, Dispatch<SetStateAction<string>>] {
  const fromUrl = useSearchParams().get('search') ?? '';
  const [value, setValue] = useState(fromUrl);
  const [seen, setSeen] = useState(fromUrl);
  if (fromUrl !== seen) {
    setSeen(fromUrl);
    setValue(fromUrl);
  }
  return [value, setValue];
}
