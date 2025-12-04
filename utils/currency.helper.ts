import type { Currency, Token } from "@/types/modal.types";

export const transformCurrenciesToTokens = (currencies: Currency[]): Token[] => {
    const tokens = currencies.map(currency => ({
        address: currency.address,
        symbol: currency.symbol,
        name: currency.name,
        decimals: currency.decimals,
    }));

    const ethToken = {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
    };

    return [ethToken, ...tokens];
};