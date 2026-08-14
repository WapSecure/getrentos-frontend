import { ClientRealtorAccess } from '@/components/realtor/ClientRealtorAccess';
import { ClientAgentAccess } from '@/components/agent/ClientAgentAccess';
import { ClientAgentTaskForm } from '@/components/agent/ClientAgentTaskForm';
export default function OwnerRealtorsPage() {
  return <div className="space-y-12"><ClientRealtorAccess /><ClientAgentAccess /><ClientAgentTaskForm /></div>;
}
