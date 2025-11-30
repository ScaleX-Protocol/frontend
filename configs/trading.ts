export interface TradingConfig {
    defaultMarketSymbol: string;
    fallbackStrategy: 'first' | 'highest_volume' | 'highest_liquidity';
    quoteCurrency: string;
}

export const TradingConfig: TradingConfig = {
    defaultMarketSymbol: 'gsWETH/gsUSDC',
    fallbackStrategy: 'highest_volume',
    quoteCurrency: 'gsUSDC'
};