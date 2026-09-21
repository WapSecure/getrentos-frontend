import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';

// Lists the cookies and browser storage the web app uses today. Update it when
// analytics or anything else is added. Not yet reviewed by counsel.

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'The cookies and browser storage GetRentos uses, and why.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updated="21 September 2026"
      intro="Cookies and similar browser storage are small pieces of data a website keeps on your device. This page lists what GetRentos uses today."
    >
      <h2 id="what-we-use">What we use</h2>
      <ul>
        <li>
          <strong>Sign-in:</strong> a secure cookie that keeps you signed in, and a session token
          held in your browser while you use the app. These are necessary for the site to work.
        </li>
        <li>
          <strong>Your preferences:</strong> your chosen language and light or dark theme, saved so
          you don&apos;t have to set them on every visit.
        </li>
        <li>
          <strong>Maps:</strong> pages that show a map load Google Maps, which may set its own
          cookies under Google&apos;s policies.
        </li>
      </ul>

      <h2 id="what-we-dont">What we don&apos;t use</h2>
      <p>
        We do not currently use advertising cookies or analytics cookies. If we add them, we will
        update this page and ask for your consent first.
      </p>

      <h2 id="control">Your choices</h2>
      <p>
        You can clear or block cookies in your browser settings. Blocking the sign-in cookie will
        stop you from staying signed in, and clearing preferences resets your language and theme.
      </p>

      <h2 id="contact">Questions</h2>
      <p>
        Email <a href="mailto:support@getrentos.com">support@getrentos.com</a>. More about how we
        handle personal information is in our <a href="/privacy">Privacy Policy</a>.
      </p>
    </LegalPage>
  );
}
