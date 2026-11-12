import { DevelopmentEditorView } from '@/components/agency/developments/DevelopmentEditorView';

export default async function AgencyDevelopmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DevelopmentEditorView id={id} />;
}
