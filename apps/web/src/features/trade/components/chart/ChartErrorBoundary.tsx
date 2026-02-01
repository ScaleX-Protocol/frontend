import React, { Component, ReactNode } from 'react';
import { TrendingUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  variant?: 'desktop' | 'mobile';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultFallback variant={this.props.variant} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({ variant }: { variant?: 'desktop' | 'mobile' }) {
  const isMobile = variant === 'mobile';

  return (
    <div className={`flex flex-col items-center justify-center bg-[#0A0A0A] border border-[#222222] rounded-[12px] ${isMobile ? 'h-[180px]' : 'min-h-[400px]'}`}>
      <TrendingUp className="w-12 h-12 text-[#404040] mb-4" />
      <p className="text-[#888888] text-sm">Chart temporarily unavailable</p>
      <p className="text-[#555555] text-xs mt-1">Trading features still active</p>
    </div>
  );
}

export default ChartErrorBoundary;
