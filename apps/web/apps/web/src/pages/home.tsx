import AppHeader from '@/components/appHeader';
import Home from '@/features/home/components/home';

export default function HomePage() {
  return (
    <div className="w-full h-screen bg-black text-[#E0E0E0] flex flex-col">
      <AppHeader />
      <Home />
    </div>
  );
}
