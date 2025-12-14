'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useCallback, useEffect } from 'react';
import { logger, setWalletContext, clearWalletContext, LogLevel, LogLabel, ServiceName } from '@/utils/logger';

/**
 * React hook to provide logging functionality with automatic wallet context
 */
export const useLogger = () => {
	const { user, ready: privyReady } = usePrivy();
	const { address: wagmiAddress } = useAccount();

	// Update wallet context when user data changes
	useEffect(() => {
		if (privyReady && user) {
			const walletContext = {
				userAddress: wagmiAddress || user.wallet?.address,
				embeddedWalletAddress: user.wallet?.address,
				email: user.email?.address,
				userId: user.id
			};
			setWalletContext(walletContext);
		}
	}, [user, privyReady, wagmiAddress]);

	// Clear wallet context on logout
	const clearContext = useCallback(() => {
		clearWalletContext();
	}, []);

	// Basic logging function with automatic wallet context
	const log = useCallback((
		level: LogLevel,
		message: string,
		label: LogLabel,
		serviceName: ServiceName,
		data?: any,
		filename?: string,
		functionName?: string,
		timestamp?: string
	) => {
		logger.log(level, message, label, serviceName, data, filename, functionName, timestamp);
	}, []);

	// Simple error logging function
	const logError = useCallback((
		error: Error | string,
		context?: any,
		functionName?: string,
		filename?: string
	) => {
		logger.log(LogLevel.ERROR,
			error instanceof Error ? error.message : error,
			LogLabel.GENERAL,
			ServiceName.FRONTEND,
			{ error: error instanceof Error ? { message: error.message, stack: error.stack } : error, ...context },
			filename,
			functionName
		);
	}, []);

	return {
		// Basic logging with all parameters
		log,
		logError,

		// Context management
		clearContext,

		// Access to wallet context
		walletContext: logger.getWalletContext()
	};
};

export default useLogger;