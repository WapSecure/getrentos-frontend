import { useEffect, useState } from 'react';
import { checkPhotoQuality } from '@sureground/ui';

export function usePhotoAdvice(file: File | null): string[] {
  const [advice, setAdvice] = useState<{ file: File; problems: string[] } | null>(null);
  useEffect(() => {
    if (!file) return;
    let current = true;
    void checkPhotoQuality(file).then((problems) => {
      if (current) setAdvice({ file, problems });
    });
    return () => {
      current = false;
    };
  }, [file]);
  return advice && advice.file === file ? advice.problems : [];
}
