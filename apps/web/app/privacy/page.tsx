import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';

// Baseline text written from what the platform actually collects and does. It has
// NOT been reviewed by counsel: have it checked against the NDPA 2023 and the
// company's own registration details before relying on it.

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What personal information GetRentos collects, why, who it is shared with, and the rights you have over it.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="21 September 2026"
      intro="GetRentos helps people rent, buy and manage property. This page explains what personal information we collect, why we collect it, who sees it, and the choices you have."
    >
      <h2 id="what-we-collect">What we collect</h2>
      <ul>
        <li>
          <strong>Your account:</strong> name, email address, phone number and the role you sign up
          as.
        </li>
        <li>
          <strong>Identity verification:</strong> when an action needs it, ID details such as your
          BVN, NIN or an identity document, and the result of the check.
        </li>
        <li>
          <strong>Property and tenancy activity:</strong> listings you post, applications you send
          (including income, employment, references and documents you attach), leases, rent and
          other payments, maintenance requests, reviews and messages.
        </li>
        <li>
          <strong>Payments:</strong> card and bank payments are processed by Paystack. We keep
          references and the last four digits of a card, not the full card number.
        </li>
        <li>
          <strong>Technical information:</strong> your IP address and device details, which we
          record with consents and security-relevant actions, and the cookies described in our{' '}
          <a href="/cookies">Cookie Policy</a>.
        </li>
      </ul>

      <h2 id="how-we-use-it">How we use it</h2>
      <ul>
        <li>To run your account and the marketplace, tenancy and payment features you use.</li>
        <li>To verify identities and properties, and to review reports of fraud.</li>
        <li>To hold and release payments, and to pay out earnings to your bank account.</li>
        <li>To keep the platform secure and to keep a record of sensitive actions.</li>
        <li>To contact you about your account, payments and support requests.</li>
      </ul>

      <h2 id="what-you-control">What you choose to share</h2>
      <ul>
        <li>
          <strong>Applications:</strong> the landlord you apply to sees what you put in the
          application, including documents you attach. They can open those files for a short time
          through a private link, and only for that application.
        </li>
        <li>
          <strong>Earlier tenancy history:</strong> shared with a landlord only if you switch it on.
        </li>
        <li>
          <strong>Credit checks:</strong> a check is run only when you agree to it for a specific
          application and enter your BVN. The BVN is used for that lookup and is not stored. We keep
          only a short summary (for example, whether you have overdue accounts) for 30 days. The
          landlord sees that summary, and you can take it back at any time, which deletes it.
        </li>
      </ul>

      <h2 id="who-we-share-with">Who we share it with</h2>
      <ul>
        <li>The landlords, owners, agents and other users you deal with, as described above.</li>
        <li>Paystack, to process payments and payouts.</li>
        <li>Identity and credit verification providers, when a check you agreed to is run.</li>
        <li>Hosting and file-storage providers that keep our systems running.</li>
        <li>Regulators, courts or law enforcement where the law requires it.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2 id="security">Keeping it safe</h2>
      <p>
        We use encrypted connections (HTTPS), restrict who can see what, keep an audit record of
        sensitive actions, and share private documents only through short-lived links. No system is
        perfectly secure, so please also protect your password and tell us straight away if you
        suspect someone else has used your account.
      </p>

      <h2 id="how-long">How long we keep it</h2>
      <p>
        We keep your information while your account is open and as long as we need it for legal,
        tax, dispute and financial record-keeping. Credit-check summaries are removed after 30 days.
        If you ask us to delete your data, we delete or anonymise it unless the law requires us to
        keep it.
      </p>

      <h2 id="your-rights">Your rights</h2>
      <p>
        Under the Nigeria Data Protection Act 2023 you can ask to see the personal information we
        hold about you, correct it, have it deleted, limit or object to how we use it, receive a
        copy of it, and withdraw a consent you gave. To do any of these, email{' '}
        <a href="mailto:support@getrentos.com">support@getrentos.com</a>. If you are unhappy with
        our response, you can complain to the Nigeria Data Protection Commission.
      </p>

      <h2 id="children">Children</h2>
      <p>
        GetRentos is for people aged 18 and over. We do not knowingly collect information from
        children.
      </p>

      <h2 id="changes">Changes to this policy</h2>
      <p>
        If we change this policy in a way that matters, we will update the date at the top and tell
        you in the app or by email.
      </p>

      <h2 id="contact">Contact us</h2>
      <p>
        GetRentos, Lagos, Nigeria · <a href="mailto:support@getrentos.com">support@getrentos.com</a>
      </p>
    </LegalPage>
  );
}
