import AppHeader from '@/components/appHeader';
import Home from '@/features/home/components/home';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <Home />
    </div>
  );
}
