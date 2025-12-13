import type { Currency, Token } from "@/types/modal.types";

export const transformCurrenciesToTokens = (currencies: Currency[]): Token[] => {
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