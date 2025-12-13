import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export const Input = ({ label, ...props }: any) => (
  <div>
    <label htmlFor="" className="text-[#A0A0A0] text-sm block mb-2">{label}</label>
    <input
      {...props}
      className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

export const Button = ({ children, variant, ...props }: any) => (
  <button
    {...props}
    className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
      variant === 'primary'
        ? 'bg-[#F06718] hover:bg-[#D85A14] text-white'
        : 'bg-[#3A3A3A] hover:bg-[#4A4A4A] text-[#E0E0E0]'
    }`}
  >
    {children}
  </button>
);

export const StatusMessage = ({ 
  type, 
  title, 
  message 
}: { 
  type: 'error' | 'loading-approve' | 'loading-process' | 'success';
  title: string;
  message?: string;
}) => {
  const configs = {
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      icon: AlertCircle,
    },
    'loading-approve': {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      icon: Loader2,
    },
    'loading-process': {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      text: 'text-yellow-400',
      icon: Loader2,
    },
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      text: 'text-green-400',
      icon: CheckCircle2,
    },
  };

  const config = configs[type];
  const Icon = config.icon;
  const isLoading = type.includes('loading');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-3 rounded-lg ${config.bg} border ${config.border}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.text} shrink-0 mt-0.5 ${isLoading ? 'animate-spin' : ''}`} />
        <div className="flex-1">
          <p className={`${config.text} text-sm font-medium`}>{title}</p>
          {message && <p className={`${config.text}/70 text-xs mt-1`}>{message}</p>}
        </div>
      </div>
    </motion.div>
  );
};