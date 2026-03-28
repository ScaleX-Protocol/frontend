import { HelpCircle } from 'lucide-react';
import { useSidebarTour } from '@/hooks/useSidebarTour';

export default function TourReplayButton() {
  const { startTour, isTourActive } = useSidebarTour();

  if (isTourActive) return null;

  return (
    <button
      type="button"
      onClick={startTour}
      className="hidden md:flex bg-[#111111] p-2.5 hover:bg-[#1A1A1A] rounded-full border border-[#222222] text-[#888888] hover:text-[#A0A0A0] transition-colors"
      aria-label="Replay platform tour"
      title="Platform tour"
    >
      <HelpCircle size={18} />
    </button>
  );
}
