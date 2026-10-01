import { notFound } from 'next/navigation';
import { GoogleOAuthDevConsent } from './GoogleOAuthDevConsent';

export default function GoogleOAuthDevPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <GoogleOAuthDevConsent />;
}
