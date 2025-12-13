'use client';

import { ReactNode } from 'react';
import FloatingLogsButton from './FloatingLogsButton';
import { LOGGING_CONFIG } from '@/configs/logging';

interface AppLoggerWrapperProps {
  children: ReactNode;
  showLogsButton?: boolean;
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center';
}

export default function AppLoggerWrapper({
  children,
  showLogsButton = LOGGING_CONFIG.showFloatingLogsButton,
  buttonPosition = LOGGING_CONFIG.floatingButtonPosition
}: AppLoggerWrapperProps) {
  return (
    <>
      {children}
      {showLogsButton && <FloatingLogsButton position={buttonPosition} />}
    </>
  );
}