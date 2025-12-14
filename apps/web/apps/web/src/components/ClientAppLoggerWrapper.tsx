'use client';

import { ReactNode } from 'react';
import AppLoggerWrapper from './AppLoggerWrapper';
import { LOGGING_CONFIG } from '@/configs/logging';

interface ClientAppLoggerWrapperProps {
  children: ReactNode;
  showLogsButton?: boolean;
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center';
}

export default function ClientAppLoggerWrapper({
  children,
  showLogsButton = LOGGING_CONFIG.showFloatingLogsButton,
  buttonPosition = LOGGING_CONFIG.floatingButtonPosition
}: ClientAppLoggerWrapperProps) {
  return <AppLoggerWrapper>{children}</AppLoggerWrapper>;
}