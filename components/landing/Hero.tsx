import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative z-10 px-6 py-20 md:px-12 lg:px-24">
      <div className="max-w-6xl mt-16 mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          The Ultimate Capital Flywheel
        </h1>

        <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
          Trade Your Assets While They Earn Yield.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="group px-8 py-4 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 flex items-center space-x-2">
            <span>Launch the Unified Protocol</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105">
            Join Waitlist
          </button>
        </div>

        {/* Stats */}
        {/* <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              4x
            </div>
            <div className="text-sm text-slate-400 mt-2">
              Capital Efficiency
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              100%
            </div>
            <div className="text-sm text-slate-400 mt-2">
              Portfolio Productive
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-linear-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
              ∞
            </div>
            <div className="text-sm text-slate-400 mt-2">Order Book Depth</div>
          </div>
        </div> */}
      </div>
    </section>
  );
}
