import { useQuery } from '@tanstack/react-query';
import { ownerApi } from '@/lib/api/owner';
import { landlordApi } from '@/lib/api/landlord';
import { useAuth } from '@/lib/auth/AuthProvider';

export interface MyHome {
  id: string;
  name: string;
  city: string;
  image?: string;
}

/**
 * The homes the signed-in owner or landlord can act on, whichever workspace
 * is open. Hosting and Home care both start from "which home?".
 */
export function useMyHomes() {
  const { usablePortal } = useAuth();
  return useQuery({
    queryKey: ['my-homes', usablePortal],
    queryFn: async (): Promise<MyHome[]> =>
      usablePortal === 'landlord'
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
