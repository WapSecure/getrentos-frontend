import { useEffect, useState } from 'react';
import { checkPhotoQuality } from '@getrentos/ui';

/**
 * Retake advice for a picked photo of a document: blur, darkness, glare, size.
 * Empty for a good photo, a non-image, or no file. Advice only.
 */
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
