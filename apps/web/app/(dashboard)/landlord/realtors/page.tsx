import { ClientRealtorAccess } from '@/components/realtor/ClientRealtorAccess';
import { ClientAgentAccess } from '@/components/agent/ClientAgentAccess';
import { ClientAgentTaskForm } from '@/components/agent/ClientAgentTaskForm';
import { PageHeader } from '@sureground/ui';

export default function LandlordRealtorsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        title="Realtor access"
        description="Choose which realtors and agents can work on your properties, and hand tasks to an agent."
      />
      <ClientRealtorAccess showHeader={false} />
      <ClientAgentAccess />
      <ClientAgentTaskForm />
    </div>
  );
}
