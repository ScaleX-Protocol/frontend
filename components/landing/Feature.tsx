import { BookOpen, RefreshCw, Zap } from 'lucide-react';

export default function FeatureSection() {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Ultimate Capital Efficiency',
      description: 'Maximize returns by keeping your entire portfolio productive. No idle assets.',
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Order Book Liquidation Protection',
      description: 'Trade safely with built-in protection against unfavorable liquidations.',
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Smart Loan Repayment System',
      description: 'Automated strategies that optimize your debt management and returns.',
    },
  ];

  return (
    <section className="relative z-10 px-6 py-20 md:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Features and Benefits</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 hover:-translate-y-2"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="w-14 h-14 bg-linear-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
