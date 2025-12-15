// useLogger hook for service-trading package
import { logger, LogLevel, LogLabel, ServiceName } from '../utils/logger';

export function useLogger() {
  return {
    log: (level: LogLevel, message: string, label: LogLabel, serviceName: ServiceName, data?: any) => {
      logger().log(level, message, label, serviceName, data);
    },
    debug: (message: string, data?: any) => logger().debug(message, data),
    info: (message: string, data?: any) => logger().info(message, data),
    warn: (message: string, data?: any) => logger().warn(message, data),
    error: (message: string, data?: any) => logger().error(message, data),
    logError: (message: string, data?: any) => logger().logError(message, data)
  };
}