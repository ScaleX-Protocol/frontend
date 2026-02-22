import AppHeader from '@/components/appHeader';
import AgentMarketplace from '@/features/agents/components/AgentMarketplace';

export default function AgentsPage() {
  return (
    <div className="w-full min-h-screen bg-black text-[#E0E0E0] flex flex-col">
      <AppHeader />
      <AgentMarketplace />
    </div>
  );
}
