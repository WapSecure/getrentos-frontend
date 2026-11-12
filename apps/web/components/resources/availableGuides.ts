import { diasporaInvestEnabled } from '@/lib/diasporaAvailability';
import { GUIDES, type Guide } from './guides';

/** Guides for services that are open; a guide to a closed service would advertise it. */
export async function availableGuides(): Promise<Guide[]> {
  const diaspora = await diasporaInvestEnabled();
  return GUIDES.filter((guide) => !guide.requiresDiaspora || diaspora);
}
