import { useQuery } from '@tanstack/react-query';
import { ownerApi } from '@/lib/api/owner';
import { landlordApi } from '@/lib/api/landlord';
import { propertyAuthorityApi } from '@/lib/api/propertyAuthority';
import { useAuth } from '@/lib/auth/AuthProvider';

export interface MyHome {
  id: string;
  name: string;
  city: string;
  image?: string;
}

export function useMyHomes() {
  const { usablePortal } = useAuth();
  return useQuery({
    queryKey: ['my-homes', usablePortal],
    queryFn: async (): Promise<MyHome[]> =>
      usablePortal === 'manager'
        ? (await propertyAuthorityApi.managed())
            .filter((p) => p.canManage && !p.archived)
            .map((p) => ({ id: p.propertyId, name: p.title, city: p.city }))
        : usablePortal === 'landlord'
          ? (await landlordApi.properties(1, 100)).items.map((p) => ({
              id: p.id,
              name: p.name,
              city: p.city,
              image: p.coverImage,
            }))
          : (await ownerApi.properties(1, 100)).items.map((p) => ({
              id: p.id,
              name: p.name,
              city: p.city,
              image: p.coverImageUrl,
            })),
    staleTime: 5 * 60_000,
  });
}
