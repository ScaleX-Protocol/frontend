export interface ChainConfig {
    defaultChainId: number;
    supportedChainIds: number[];
    blockExplorers: {
        [chainId: number]: {
            name: string;
            url: string;
        };
    };
}

export const ChainConfig: ChainConfig = {
    defaultChainId: 84532,
    supportedChainIds: [84532],
    blockExplorers: {
        84532: {
            name: 'BaseScan',
            url: 'https://sepolia.basescan.org'
        }
    }
};

// Helper function to get block explorer URL for a transaction
export const getBlockExplorerTxUrl = (txHash: string, chainId?: number): string => {
    const targetChainId = chainId || ChainConfig.defaultChainId;
    const explorer = ChainConfig.blockExplorers[targetChainId];

    if (!explorer) {
        console.warn(`No block explorer configured for chain ID ${targetChainId}`);
        return '#';
    }

    return `${explorer.url}/tx/${txHash}`;
};
