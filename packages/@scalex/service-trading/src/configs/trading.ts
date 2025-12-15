export interface ITradingConfig {
    defaultMarketSymbol: string;
    fallbackStrategy: 'first' | 'highest_volume' | 'highest_liquidity';
    quoteCurrency: string;
}

export const TradingConfig: ITradingConfig = {
    defaultMarketSymbol: 'gsWETH/gsUSDC',
    fallbackStrategy: 'highest_volume',
    quoteCurrency: 'gsUSDC'
};