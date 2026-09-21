import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';

// Baseline terms written from how the platform works (roles, escrow, plans,
// disputes). They have NOT been reviewed by counsel and should be before launch,
// in particular the liability, fee, escrow and governing-law sections.

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms for using GetRentos to rent, buy, sell and manage property.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="21 September 2026"
      intro="These terms apply when you use GetRentos. By creating an account or using the platform you agree to them. If you don’t agree, please don’t use it."
    >
      <h2 id="who-can-use-it">Who can use GetRentos</h2>
      <p>
        You must be at least 18 and able to enter a binding agreement. You are responsible for the
        accuracy of what you give us and for keeping your sign-in details safe.
      </p>

      <h2 id="what-we-are">What GetRentos is</h2>
      <p>
        GetRentos is a platform that connects renters, landlords, owners, buyers, realtors, agents
        and estate managers and provides tools for verification, payments and property management.
        We are not a party to a tenancy or a sale between users, and we do not guarantee that any
        listing, person or deal is as described, even where we have verified an identity or reviewed
        documents. Please do your own checks before you commit money.
      </p>

      <h2 id="listings">Listings and content</h2>
      <p>
        If you post a listing or other content, you confirm it is accurate, that you have the right
        to post it, and that it does not break the law or anyone&apos;s rights. We may remove
        content or suspend accounts that are misleading, fraudulent or unsafe.
      </p>

      <h2 id="verification">Verification</h2>
      <p>
        Some actions need your identity or your ownership of a property to be verified first. You
        agree to give truthful information and we may ask for more before we approve something.
      </p>

      <h2 id="payments">Payments and escrow</h2>
      <p>
        Payments are processed by Paystack. Where a payment is held in escrow, it is released when
        the conditions for that transaction are met, or returned as our dispute process decides.
        Fees, if any, are shown before you pay. You agree to pay what you owe on time.
      </p>

      <h2 id="plans">Plans</h2>
      <p>
        There is a free plan for every role and a paid Pro plan with extra tools. Paid plans renew
        until you cancel, and the price shown at sign-up applies until you are told otherwise.
      </p>

      <h2 id="acceptable-use">Acceptable use</h2>
      <ul>
        <li>Don&apos;t use GetRentos for fraud, harassment or anything unlawful.</li>
        <li>Don&apos;t impersonate anyone or use someone else&apos;s identity or documents.</li>
        <li>Don&apos;t try to break, overload or gain unauthorised access to the platform.</li>
        <li>
          Don&apos;t take payments or arrangements agreed on the platform outside it to avoid fees.
        </li>
      </ul>

      <h2 id="disputes">Disputes</h2>
      <p>
        If you have a problem with another user, please use the dispute tools in the app first. We
        will review the evidence and may hold or release funds accordingly. This does not limit your
        legal rights.
      </p>

      <h2 id="liability">Our responsibility</h2>
      <p>
        We work hard to keep GetRentos reliable and safe, but we provide it as it is. To the extent
        the law allows, we are not liable for losses that arise from another user&apos;s actions,
        from listings or documents we did not create, or from interruptions we could not reasonably
        prevent. Nothing in these terms limits liability that cannot lawfully be limited.
      </p>

      <h2 id="ending">Ending your account</h2>
      <p>
        You can stop using GetRentos at any time. We may suspend or close an account that breaks
        these terms or puts other users at risk. Amounts already owed remain payable, and funds in
        escrow are handled as described above.
      </p>

      <h2 id="changes">Changes</h2>
      <p>
        We may update these terms. If a change matters, we will tell you in the app or by email
        before it applies. Continuing to use GetRentos after that means you accept the change.
      </p>

      <h2 id="law">Governing law</h2>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>

      <h2 id="contact">Contact</h2>
      <p>
        GetRentos, Lagos, Nigeria · <a href="mailto:support@getrentos.com">support@getrentos.com</a>
        . See also our <a href="/privacy">Privacy Policy</a> and{' '}
        <a href="/cookies">Cookie Policy</a>.
      </p>
    </LegalPage>
  );
}
