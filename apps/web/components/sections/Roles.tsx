'use client';

import { Home, Building2, TrendingUp, Search, Users, UserCheck, Settings } from 'lucide-react';
import { SectionHeader } from '../ui/SectionHeader';
import { Card } from '../ui/Card';

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
      'List properties, vet tenants, collect rent through escrow, manage units and finance.',
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
  {
    id: 'admin',
    name: 'Admin',
    icon: Settings,
    description: 'Verify properties, resolve disputes, monitor fraud, and oversee platform health.',
  },
];

export const Roles = () => {
  return (
    <section id="roles" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          badge="SECTION 01 · ROLES"
          title="Seven roles, one shared trust layer."
          description="Everyone gets a tailored workspace — same verification, escrow and dispute rails underneath."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-4">
                <role.icon className="w-6 h-6 text-[#c4a747]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {role.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{role.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
