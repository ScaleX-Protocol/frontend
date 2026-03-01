import React from 'react';

/**
 * A polished loading fallback for lazy-loaded route components.
 * Shows a pulsing spinner with the ScaleX brand feel.
 */
export default function RouteLoadingFallback() {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '60vh',
                gap: '16px',
            }}
        >
            {/* Animated spinner */}
            <div
                style={{
                    width: '36px',
                    height: '36px',
                    border: '3px solid rgba(103, 111, 255, 0.15)',
                    borderTopColor: '#676FFF',
                    borderRadius: '50%',
                    animation: 'route-spin 0.7s linear infinite',
                }}
            />
            {/* Subtle "Loading" text */}
            <span
                style={{
                    fontSize: '13px',
                    color: 'rgba(224, 224, 224, 0.5)',
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                    animation: 'route-pulse 1.5s ease-in-out infinite',
                }}
            >
                Loading…
            </span>
            {/* Inline keyframes — no external CSS needed */}
            <style>{`
        @keyframes route-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes route-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
        </div>
    );
}
