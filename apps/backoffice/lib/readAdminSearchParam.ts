'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'next/navigation';

// Re-seeded on change: a register already open does not remount when a header-search result links to it.
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
