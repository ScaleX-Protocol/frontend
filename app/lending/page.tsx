import AppHeader from '@/components/appHeader';
import Lending from '@/features/lending/components/lending';

export default function LendingPage() {
  return (
    <div className="w-full h-screen bg-black text-[#E0E0E0] flex flex-col">
      <AppHeader />
      <Lending />
    </div>
  );
}
