import { apiFetch } from './client';

export interface Wishlist {
  id: string;
  name: string;
  isDefault: boolean;
  count: number;
  createdAt: string;
}

export const wishlistsApi = {
  list: () => apiFetch<Wishlist[]>('/renter/wishlists'),
  create: (name: string) =>
    apiFetch<Wishlist>('/renter/wishlists', { method: 'POST', body: { name } }),
  rename: (id: string, name: string) =>
    apiFetch<Wishlist>(`/renter/wishlists/${id}`, { method: 'PATCH', body: { name } }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/renter/wishlists/${id}`, { method: 'DELETE' }),
};
