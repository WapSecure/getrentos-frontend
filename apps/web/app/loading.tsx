import { PageLoadingState } from '@getrentos/ui';

/** Global route-transition fallback while the requested page streams in. */
export default function Loading() {
  return <PageLoadingState />;
}
