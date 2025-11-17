import { ParticleTextEffect } from '@/components/ui/animations/particle-text-effect';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <ParticleTextEffect words={['404', 'ERROR', 'LOST', 'OOPS']} />
    </div>
  );
}
