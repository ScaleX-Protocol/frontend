import AppHeader from '@/components/appHeader';
import Overview from '@/features/overview/components/Overview';

export default function OverviewPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <Overview />
    </div>
  );
}
