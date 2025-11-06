import Spline from "@splinetool/react-spline";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative z-10 px-6 py-20 md:px-12 lg:px-24">
      <div className="max-w-6xl mt-16 mx-auto text-center md:text-start">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-full">
            <h1 className="text-5xl md:text-6xl font-semibold leading-tight mb-2 mt-16">
              The Ultimate Capital Flywheel
            </h1>

            <p className="text-xl md:text-xl text-slate-300 max-w-3xl mx-auto">
              Trade Your Assets While They Earn Yield.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center mt-20">
              <Link
                href="/waitlist"
                className="group px-8 py-4 bg-white/20 hover:bg-white/25 rounded-full font-semibold text-lg transition-all flex items-center space-x-2"
              >
                <span>Join Waitlist</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <button className="group px-8 py-4 font-semibold text-lg transition-all flex items-center space-x-2">
                Learn More
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>
          <div className="min-w-[400px] h-[500px] mb-8">
            <Spline scene="https://prod.spline.design/j4nlRZP7QSv8HVhm/scene.splinecode" />
          </div>
        </div>
      </div>
    </section>
  );
}
