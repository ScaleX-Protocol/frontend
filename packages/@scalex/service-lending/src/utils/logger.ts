// Simple logger mock for service-lending
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum LogLabel {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  BORROW = 'BORROW',
  REPAY = 'REPAY'
}

export enum ServiceName {
  LENDING = 'LENDING'
}

export function useLogger() {
  return {
    debug: (message: string, data?: any) => console.debug(message, data),
    info: (message: string, data?: any) => console.info(message, data),
    warn: (message: string, data?: any) => console.warn(message, data),
    error: (message: string, data?: any) => console.error(message, data)
  };
}

export const log = {
  debug: useLogger().debug,
  info: useLogger().info,
  warn: useLogger().warn,
  error: useLogger().error
};