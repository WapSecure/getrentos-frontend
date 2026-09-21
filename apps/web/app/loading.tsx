import { PageLoadingState } from '@getrentos/ui/Skeleton';

/** Global route-transition fallback while the requested page streams in. */
export default function Loading() {
  return <PageLoadingState />;
}
