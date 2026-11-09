import { PageLoadingState } from '@sureground/ui';

/** Dashboard-wide loading fallback while role data streams in. */
export default function DashboardLoading() {
  return <PageLoadingState />;
}
