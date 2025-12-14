import AppHeader from '@/components/appHeader';
import Faucet from '@/features/faucet/components/faucet';

export default function FaucetPage() {
  return (
    <div className="w-full h-screen bg-black text-[#E0E0E0] flex flex-col">
      <AppHeader />
      <Faucet />
    </div>
  );
}
