import { ClientRealtorAccess } from '@/components/realtor/ClientRealtorAccess';
import { ClientAgentAccess } from '@/components/agent/ClientAgentAccess';
import { ClientAgentTaskForm } from '@/components/agent/ClientAgentTaskForm';

export default function LandlordRealtorsPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Realtor Access</h1>
        <p className="text-muted-foreground mt-1">
          Choose which realtors and agents can work on your properties, and hand tasks to an agent.
        </p>
      </div>
      <ClientRealtorAccess />
      <ClientAgentAccess />
      <ClientAgentTaskForm />
    </div>
  );
}
