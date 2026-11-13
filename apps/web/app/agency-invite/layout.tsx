import type { Metadata } from 'next';

// Private return and invitation screens: reached from a link sent to one person, never from search.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
