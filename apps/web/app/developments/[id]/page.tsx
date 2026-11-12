import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DevelopmentPage } from '@/components/showroom/DevelopmentPage';
import { developmentPath, fetchPublicDevelopment } from '@/lib/publicDevelopments';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const d = await fetchPublicDevelopment(id);
  if (!d) return { title: 'Development not found', robots: { index: false } };
  return {
    title: `${d.name}, ${d.city}`,
    description: `Off-plan development by ${d.developerName} in ${d.city}, ${d.state}. Checked by Sureground staff; you pay the developer directly.`,
    alternates: { canonical: developmentPath(d.id) },
  };
}

export default async function DevelopmentDetailPage({ params }: Props) {
  const { id } = await params;
  const development = await fetchPublicDevelopment(id);
  if (!development) notFound();
  return <DevelopmentPage development={development} />;
}
