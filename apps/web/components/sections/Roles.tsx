import { Home, Building2, TrendingUp, Search, Users, UserCheck } from '@sureground/icons';
import { MarketingCard, MarketingIconTile, SectionHeading } from './primitives';

const roles = [
  {
    id: 'renter',
    name: 'Renter',
    icon: Home,
    description:
      'Search verified homes, apply digitally, pay rent securely, manage lease and maintenance.',
  },
  {
    id: 'landlord',
    name: 'Landlord',
    icon: Building2,
    description:
      'List properties, vet tenants, collect rent safely through Sureground, manage units and finance.',
  },
  {
    id: 'owner',
    name: 'Property Owner',
    icon: TrendingUp,
    description: 'List for sale, accept offers, track value, convert listings into rentals.',
  },
  {
    id: 'buyer',
    name: 'Property Buyer',
    icon: Search,
    description: 'Save, compare and tour properties, make offers, and close with protected funds.',
  },
  {
    id: 'realtor',
    name: 'Realtor',
    icon: Users,
    description:
      'Bring listings, schedule tours, negotiate on behalf, and earn from verified deals.',
  },
  {
    id: 'agent',
    name: 'Agent',
    icon: UserCheck,
    description: "Operate on a landlord or owner's behalf within scoped, delegated permissions.",
  },
];

export const Roles = () => {
  return (
    <section id="roles" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          badge="ROLES"
          title="Six roles, one shared trust layer."
          description="Everyone gets a tailored workspace: same verification, payment protection and dispute rails underneath."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <MarketingCard key={role.id} className="p-6">
              <MarketingIconTile icon={role.icon} size="lg" className="mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">{role.name}</h3>
              <p className="text-muted-foreground text-sm">{role.description}</p>
            </MarketingCard>
          ))}
        </div>
      </div>
    </section>
  );
};
