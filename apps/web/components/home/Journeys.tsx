import { ArrowLink } from '@/components/marketing/ArrowLink';
import { Container } from '@/components/marketing/Container';
import { FeatureRow } from '@/components/marketing/FeatureRow';
import { SectionIntro } from '@/components/marketing/SectionIntro';
import { photos } from '@/components/marketing/photos';

export const Journeys = () => (
  <section id="how-it-works" aria-labelledby="journeys-title" className="bg-card py-20 md:py-28">
    <Container>
      <SectionIntro
        id="journeys-title"
        eyebrow="How Sureground works"
        title="One place to rent, buy, stay and manage"
        lead="Every journey runs on the same checks: who you are dealing with, what has been verified, and where your money is."
      />
      <div className="flex flex-col gap-20 md:gap-28">
        <FeatureRow
          eyebrow="Rent"
          title="Rent a home with the paperwork in one place"
          photo={photos.livingRoomLight}
          action={<ArrowLink href="/rent">Find a home to rent</ArrowLink>}
        >
          <p>
            Book viewings, apply and pay rent from one account. Rent is released to the landlord on
            schedule, and a dispute keeps the money held.
          </p>
        </FeatureRow>
        <FeatureRow
          eyebrow="Buy"
          title="Buy with the documents in view"
          photo={photos.housePoolTerrace}
          reverse
          action={<ArrowLink href="/buy">See homes for sale</ArrowLink>}
        >
          <p>
            Ownership and title documents are reviewed by our team before a property is marked
            verified. Your deposit is released only once you confirm.
          </p>
        </FeatureRow>
        <FeatureRow
          eyebrow="Short stays"
          title="Short stays with the full price up front"
          photo={photos.livingRoomEvening}
          action={<ArrowLink href="/shortlets">Browse short stays</ArrowLink>}
        >
          <p>
            Book serviced apartments by the night. The price you see includes fees before you pay,
            and the host is paid after you check in.
          </p>
        </FeatureRow>
        <FeatureRow
          eyebrow="Landlords and owners"
          title="Manage property without the spreadsheets"
          photo={photos.diningKitchen}
          reverse
          action={<ArrowLink href="/home-management">Property management</ArrowLink>}
        >
          <p>
            Collect rent, issue receipts, handle maintenance and send owners monthly statements from
            one workspace, with every action logged.
          </p>
        </FeatureRow>
      </div>
    </Container>
  </section>
);
