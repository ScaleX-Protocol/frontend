import AppHeader from '@/components/appHeader';
import LeaderboardTable from '@/features/leaderboard/components/LeaderboardTable';

export default function LeaderboardPage() {
    return (
        <div className="w-full min-h-screen bg-black text-[#E0E0E0] flex flex-col">
            <AppHeader />
            <LeaderboardTable />
        </div>
    );
}
