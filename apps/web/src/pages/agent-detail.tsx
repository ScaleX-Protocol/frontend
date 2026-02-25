import { useParams } from '@tanstack/react-router';
import AgentDetail from '@/features/agents/components/AgentDetail';

export default function AgentDetailPage() {
  const params = useParams({ strict: false }) as { agentTokenId?: string };
  return (
    <div className="w-full min-h-screen bg-black text-[#E0E0E0] flex flex-col">
      <AgentDetail agentTokenId={params.agentTokenId} />
    </div>
  );
}
