import { ArrowRight } from 'lucide-react';

export default function CallToActionSection() {
  return (
    <section className="relative z-10 px-6 py-20 md:px-12 lg:px-24 mb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-linar-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/20 rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">It's Time to Put Your Capital to Work.</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Don't choose between maximizing yield and executing trades. Experience the integrated, risk-managed, and
            hyper-efficient future of DeFi built for the sophisticated trader and yield seeker.
          </p>
          <button
            type="button"
            className="group px-10 py-5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full font-semibold text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 flex items-center space-x-2 mx-auto"
          >
            <span>Start Earning and Trading Now</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
