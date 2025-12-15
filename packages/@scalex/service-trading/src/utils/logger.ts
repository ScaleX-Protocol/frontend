// Simple logger for service-trading package
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum LogLabel {
  TRADING = 'trading',
  WEBSOCKET = 'websocket',
  ORDERBOOK = 'orderbook'
}

export enum ServiceName {
  TRADING = 'trading',
  WEBSOCKET = 'websocket'
}

export function logger() {
  return {
    debug: (message: string, data?: any) => console.debug(`[${LogLabel.TRADING}] ${message}`, data),
    info: (message: string, data?: any) => console.info(`[${LogLabel.TRADING}] ${message}`, data),
    warn: (message: string, data?: any) => console.warn(`[${LogLabel.TRADING}] ${message}`, data),
    error: (message: string, data?: any) => console.error(`[${LogLabel.TRADING}] ${message}`, data),
    withContext: (context: any) => ({
      debug: (message: string, data?: any) => console.debug(`[${LogLabel.TRADING}] ${message}`, { ...context, ...data }),
      info: (message: string, data?: any) => console.info(`[${LogLabel.TRADING}] ${message}`, { ...context, ...data }),
      warn: (message: string, data?: any) => console.warn(`[${LogLabel.TRADING}] ${message}`, { ...context, ...data }),
      error: (message: string, data?: any) => console.error(`[${LogLabel.TRADING}] ${message}`, { ...context, ...data })
    })
  };
}