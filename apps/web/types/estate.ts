export interface Estate {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  gateCount: number | null;
  householdCount: number;
  createdAt: string;
}

export type HouseholdStatus = 'active' | 'inactive';

export interface Household {
  id: string;
  estateId: string;
  unitLabel: string;
  residentName: string;
  contactPhone?: string;
  contactEmail?: string;
  status: HouseholdStatus;
  createdAt: string;
}
