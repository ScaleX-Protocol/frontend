/**
 * Production-safe logger that only logs in development environment
 * In production, errors can be sent to error monitoring services
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}

class ProdLogger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
    };
  }

  private formatMessage(entry: LogEntry): string {
    const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : '';
    return `[${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry('debug', message, context);
    console.debug(this.formatMessage(entry));
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry('info', message, context);
    console.log(this.formatMessage(entry));
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('warn', message, context);

    if (this.isDevelopment) {
      console.warn(this.formatMessage(entry));
    } else {
      // In production, you might want to send warnings to a monitoring service
      // Example: sendToMonitoring(entry);
    }
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const entry = this.createLogEntry('error', message, { ...context, error });

    if (this.isDevelopment) {
      console.error(this.formatMessage(entry), error);
    } else {
      // In production, send errors to a monitoring service
      // Example: sendErrorToMonitoring(entry, error as Error);

      // For now, still log errors to console in production for debugging
      console.error(this.formatMessage(entry), error);
    }
  }

  /**
   * Create a logger instance with a specific context
   */
  withContext(context: Record<string, any>): ProdLogger {
    const logger = new ProdLogger();
    const originalMethods = {
      debug: logger.debug.bind(logger),
      info: logger.info.bind(logger),
      warn: logger.warn.bind(logger),
      error: logger.error.bind(logger),
    };

    // Override methods to include context
    logger.debug = (message: string, additionalContext?: Record<string, any>) => {
      return originalMethods.debug(message, { ...context, ...additionalContext });
    };

    logger.info = (message: string, additionalContext?: Record<string, any>) => {
      return originalMethods.info(message, { ...context, ...additionalContext });
    };

    logger.warn = (message: string, additionalContext?: Record<string, any>) => {
      return originalMethods.warn(message, { ...context, ...additionalContext });
    };

    logger.error = (message: string, error?: Error | unknown, additionalContext?: Record<string, any>) => {
      return originalMethods.error(message, error, { ...context, ...additionalContext });
    };

    return logger;
  }
}

// Export a singleton instance
export const logger = new ProdLogger();

// Export a function to create contextual loggers
export const createLogger = (context: Record<string, any>) => {
  return logger.withContext(context);
};