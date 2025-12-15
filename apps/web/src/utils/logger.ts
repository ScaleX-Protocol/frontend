'use client';

import { logger as prodLogger } from './prodLogger';

// Enums for consistent logging
export enum LogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error'
}

export enum LogLabel {
	API = 'api',
	TRADING = 'trading',
	DEPOSIT = 'deposit',
	WITHDRAW = 'withdraw',
	APPROVAL = 'approval',
	CONTRACT = 'contract',
	BALANCE = 'balance',
	WALLET = 'wallet',
	USER = 'user',
	UI = 'ui',
	SYSTEM = 'system',
	GENERAL = 'general',
	WEBSOCKET = 'websocket'
}

export enum ServiceName {
	FRONTEND = 'frontend',
	WEBAPP = 'webapp',
	TRADING_UI = 'trading-ui',
	DEPOSIT_UI = 'deposit-ui',
	WEBSOCKET = 'websocket'
}

// Wallet context interface
export interface WalletContext {
	userAddress?: string;
	embeddedWalletAddress?: string;
	email?: string;
	userId?: string;
}

// Global wallet context storage
let globalWalletContext: WalletContext = {};

/**
 * Set the global wallet context for logging
 * This should be called when user connects their wallet
 */
export const setWalletContext = (context: WalletContext) => {
	globalWalletContext = { ...globalWalletContext, ...context };
};

/**
 * Get the current wallet context
 */
export const getWalletContext = (): WalletContext => ({ ...globalWalletContext });

/**
 * Clear the wallet context (called on logout)
 */
export const clearWalletContext = () => {
	globalWalletContext = {};
};

import { logStore } from './logQuery';

/**
 * Enhanced logging function for frontend with wallet context
 */
export const log = (
	level: LogLevel,
	message: string,
	label: LogLabel,
	serviceName: ServiceName,
	data: any = {},
	filename: string = 'unknown',
	functionName: string = 'unknown',
	timestamp?: string
) => {
	// Wrap everything in try-catch to ensure app never crashes due to logging
	try {
		// Sanitize inputs to prevent any potential issues
		const safeMessage = String(message || '').substring(0, 10000);
		const safeData = data && typeof data === 'object' ? JSON.stringify(data).substring(0, 5000) : String(data || '');
		const safeFunctionName = String(functionName || 'unknown').substring(0, 100);
		const safeFilename = String(filename || 'unknown').substring(0, 100);

		// Create timestamp if not provided
		const logTimestamp = timestamp || new Date().toISOString();

		// Create structured log entry
		const logEntry = {
			timestamp: logTimestamp,
			level: String(level).toUpperCase(),
			service: String(serviceName || 'unknown'),
			label: String(label || 'general'),
			filename: safeFilename,
			function: safeFunctionName,
			message: safeMessage,
			data: data && typeof data === 'object' ? data : safeData,
			// Add wallet context
			wallet: {
				userAddress: globalWalletContext.userAddress || 'not_connected',
				embeddedWalletAddress: globalWalletContext.embeddedWalletAddress || 'not_available',
				email: globalWalletContext.email || 'not_provided',
				userId: globalWalletContext.userId || 'anonymous'
			},
			// Add browser context
			browser: {
				userAgent: typeof navigator !== 'undefined' ? navigator.userAgent?.substring(0, 200) : 'unknown',
				url: typeof window !== 'undefined' ? window.location?.href : 'unknown',
				online: typeof navigator !== 'undefined' ? navigator.onLine : false
			}
		};

		// Store log for querying
		try {
			logStore.addLog(logEntry);
		} catch (storeError) {
			// Silently ignore store errors to prevent app crashes
			prodLogger.debug('Failed to store log for querying', { error: storeError });
		}

		// Format message for console output
		const walletPrefix = globalWalletContext.userAddress
			? `[${globalWalletContext.userAddress.substring(0, 6)}...${globalWalletContext.userAddress.substring(-4)}]`
			: '[NO_WALLET]';

		const consoleMessage = `[${logTimestamp}] [${level.toUpperCase()}] [${serviceName}/${label}] ${walletPrefix} ${safeFunctionName}() - ${safeMessage}`;

		// Always log to console
		try {
			switch (level) {
				case LogLevel.DEBUG:
					prodLogger.debug(consoleMessage, data);
					break;
				case LogLevel.INFO:
					prodLogger.info(consoleMessage, data);
					break;
				case LogLevel.WARN:
					prodLogger.warn(consoleMessage, data);
					break;
				case LogLevel.ERROR:
					prodLogger.error(consoleMessage, null, data);
					break;
				default:
					prodLogger.info(consoleMessage, data);
			}
		} catch (consoleError) {
			// Last resort fallback
			try {
				prodLogger.info(`[LOG ERROR] ${safeMessage}`, { error: consoleError });
			} catch {
				// Even prodLogger failed - do nothing
			}
		}

		// Send to external logging service if configured (optional)
		if (import.meta.env.VITE_ENABLE_EXTERNAL_LOGGING === 'true') {
			// Make this non-blocking
			setTimeout(() => {
				try {
					sendToExternalLogging(level, logEntry);
				} catch (externalError) {
					// Silently ignore external logging failures
					prodLogger.debug('External logging failed', { error: externalError });
				}
			}, 0);
		}
	} catch (criticalError) {
		// Critical logging error - last resort fallback
		try {
			prodLogger.info(`[CRITICAL LOG ERROR] ${message}`, { error: criticalError });
		} catch {
			// Complete logging failure - do absolutely nothing
		}
	}
};

/**
 * Enhanced error logging utility with wallet context
 */
export const logError = (
	error: Error | string,
	context?: any,
	functionName?: string,
	filename?: string
) => {
	try {
		const safeError = typeof error === 'string' ? new Error(error) : (error || new Error('Unknown error'));
		const safeContext = context && typeof context === 'object' ? context : {};
		const safeFunctionName = String(functionName || 'unknown').substring(0, 100);
		const safeFilename = String(filename || 'unknown').substring(0, 100);

		const errorInfo = {
			error: {
				message: String(safeError.message || 'No message').substring(0, 1000),
				name: String(safeError.name || 'Error'),
				stack: String(safeError.stack || '').substring(0, 2000)
			},
			context: {
				function: safeFunctionName,
				filename: safeFilename,
				parameters: safeContext || {},
				...safeContext,
			},
			wallet: {
				userAddress: globalWalletContext.userAddress || 'not_connected',
				embeddedWalletAddress: globalWalletContext.embeddedWalletAddress || 'not_available',
				email: globalWalletContext.email || 'not_provided',
				userId: globalWalletContext.userId || 'anonymous'
			},
			timestamp: new Date().toISOString(),
		};

		// Log to console
		const walletPrefix = globalWalletContext.userAddress
			? `[${globalWalletContext.userAddress.substring(0, 6)}...${globalWalletContext.userAddress.substring(-4)}]`
			: '[NO_WALLET]';

		prodLogger.error(`[ERROR] [${walletPrefix}] ${safeFunctionName}() - ${safeError.message}`, errorInfo);

		// Send to external logging if configured
		if (import.meta.env.VITE_ENABLE_EXTERNAL_LOGGING === 'true') {
			setTimeout(() => {
				try {
					sendToExternalLogging(LogLevel.ERROR, errorInfo);
				} catch {
					// Silently ignore external logging failures
				}
			}, 0);
		}
	} catch {
		// Critical failure - try basic prodLogger
		try {
			prodLogger.error('[CRITICAL ERROR LOG FAILURE]', typeof error === 'object' && error && 'message' in error ? (error as Error).message : 'Unknown error');
		} catch {
			// Complete failure - do nothing
		}
	}
};

/**
 * Log function call with parameters and result
 */
export const logFunctionCall = (
	functionName: string,
	parameters: any,
	result?: any,
	filename?: string,
	label: LogLabel = LogLabel.GENERAL
) => {
	try {
		const safeFunctionName = String(functionName || 'unknown').substring(0, 100);
		const safeParameters = parameters && typeof parameters === 'object'
			? JSON.stringify(parameters).substring(0, 1000)
			: String(parameters || '').substring(0, 500);
		const safeResult = result && typeof result === 'object'
			? JSON.stringify(result).substring(0, 1000)
			: String(result || '').substring(0, 500);

		log(
			LogLevel.DEBUG,
			`Function called with params: ${safeParameters}, result: ${safeResult}`,
			label,
			ServiceName.FRONTEND,
			{ parameters, result },
			filename || 'unknown',
			safeFunctionName
		);
	} catch {
		// Ignore logging failures
	}
};

/**
 * Log user actions with wallet context
 */
export const logUserAction = (
	action: string,
	details: any = {},
	component?: string
) => {
	try {
		log(
			LogLevel.INFO,
			`User action: ${action}`,
			LogLabel.USER,
			ServiceName.WEBAPP,
			details,
			component || 'unknown',
			'userAction'
		);
	} catch {
		// Ignore logging failures
	}
};

/**
 * Log contract interactions with wallet context
 */
export const logContractInteraction = (
	contractName: string,
	functionName: string,
	parameters: any,
	result?: any,
	success: boolean = true
) => {
	try {
		const label = success ? LogLabel.CONTRACT : LogLabel.GENERAL;
		const message = `Contract ${contractName}.${functionName} ${success ? 'executed' : 'failed'}`;

		log(
			success ? LogLevel.INFO : LogLevel.ERROR,
			message,
			label,
			ServiceName.FRONTEND,
			{ contractName, functionName, parameters, result },
			'contract',
			functionName
		);
	} catch {
		// Ignore logging failures
	}
};

/**
 * Send logs to external logging service (placeholder implementation)
 */
const sendToExternalLogging = (level: LogLevel, logEntry: any) => {
	// This is a placeholder for external logging integration
	// You can integrate with services like:
	// - Datadog
	// - LogRocket
	// - Sentry
	// - Custom logging endpoint

	if (import.meta.env.VITE_LOGGING_ENDPOINT) {
		fetch(import.meta.env.VITE_LOGGING_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				level,
				...logEntry
			})
		}).catch(() => {
			// Silently ignore external logging failures
		});
	}
};

// Export a default logger object for convenience
export const logger = {
	log: (
		level: LogLevel,
		message: string,
		label: LogLabel,
		serviceName: ServiceName,
		data?: any,
		filename?: string,
		functionName?: string,
		timestamp?: string
	) =>
		log(level, message, label, serviceName, data, filename, functionName, timestamp),
	debug: (message: string, data?: any, filename?: string, functionName?: string) =>
		log(LogLevel.DEBUG, message, LogLabel.GENERAL, ServiceName.FRONTEND, data, filename, functionName),
	info: (message: string, data?: any, filename?: string, functionName?: string) =>
		log(LogLevel.INFO, message, LogLabel.GENERAL, ServiceName.FRONTEND, data, filename, functionName),
	warn: (message: string, data?: any, filename?: string, functionName?: string) =>
		log(LogLevel.WARN, message, LogLabel.GENERAL, ServiceName.FRONTEND, data, filename, functionName),
	error: (error: Error | string, context?: any, functionName?: string, filename?: string) =>
		logError(error, context, functionName, filename),
	userAction: logUserAction,
	contractInteraction: logContractInteraction,
	functionCall: logFunctionCall,
	setWalletContext,
	clearWalletContext,
	getWalletContext
};

export default logger;