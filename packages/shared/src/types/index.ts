export type UserRole = 'renter' | 'landlord' | 'owner' | 'buyer' | 'realtor' | 'agent' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isVerified: boolean;
  trustScore: number;
  createdAt: Date;
}
