export type HexAddress = `0x${string}`;

export interface ChainContracts {
    [chainId: number] : {
        faucetAddress: HexAddress;
    }
}

export const Contracts: ChainContracts = {
    84532: {
        faucetAddress: '0x1234567890123456789012345678901234567890' as HexAddress
    }
}