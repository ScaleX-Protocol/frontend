import type { Currency, Token } from "@/types/modal.types";
import { ChainTypeConfig } from "@/configs/chainType";

/**
 * Solana devnet token definitions.
 * Addresses and decimals from solana-program/API_DOCS.md deployment reference.
 */
const SOLANA_TOKENS: Token[] = [
    {
        address: 'So11111111111111111111111111111111111111112', // Native SOL wrapped mint
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        tokenType: 'native',
        underlyingTokenAddress: null,
        chainId: 101,
        sourceChainId: null,
    },
    {
        address: import.meta.env.VITE_TOKEN_USDT_MINT || 'Fx4eqJMFpVtKt7Z27DqaU1QRTX4hKvsustzDyRZDNo7M',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        tokenType: 'underlying',
        underlyingTokenAddress: null,
        chainId: 101,
        sourceChainId: null,
    },
    {
        address: import.meta.env.VITE_TOKEN_BTC_MINT || 'VJdwDEtpbQcP1xoJVtwUQ3EVhoxhid7LcEMfRtqmcGu',
        symbol: 'BTC',
        name: 'Bitcoin',
        decimals: 8,
        tokenType: 'underlying',
        underlyingTokenAddress: null,
        chainId: 101,
        sourceChainId: null,
    },
    {
        address: import.meta.env.VITE_TOKEN_WETH_MINT || '4WxBZ9A5ZPqjvbAWMuHUzDGge1SuamWZM23dwB9c3S8n',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 8,
        tokenType: 'underlying',
        underlyingTokenAddress: null,
        chainId: 101,
        sourceChainId: null,
    },
];

/**
 * Transform API currencies to Token array.
 *
 * - EVM mode: prepends native ETH token + API currencies
 * - Solana mode: returns hardcoded Solana tokens with correct mint addresses
 *   (API returns EVM 0x... addresses which are invalid for Solana ATA queries)
 */
export const transformCurrenciesToTokens = (currencies: Currency[]): Token[] => {
    if (ChainTypeConfig.isSolana) {
        return SOLANA_TOKENS;
    }

    // EVM: original behavior
    const tokens = currencies.map(currency => ({
        address: currency.address,
        symbol: currency.symbol,
        name: currency.name,
        decimals: currency.decimals,
        tokenType: currency.tokenType,
        underlyingTokenAddress: currency.underlyingTokenAddress,
        chainId: currency.chainId,
        sourceChainId: currency.sourceChainId,
    }));

    const ethToken = {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        tokenType: 'native' as const,
        underlyingTokenAddress: null,
        chainId: 84532,
        sourceChainId: null,
    };

    return [ethToken, ...tokens];
};