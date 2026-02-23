import { baseSepolia } from 'viem/chains';
import { defineChain } from 'viem';

// Hanya Base Sepolia sesuai permintaanmu
export const SUPPORTED_EVM_CHAINS = [defineChain(baseSepolia)];
export const DEFAULT_EVM_CHAIN = defineChain(baseSepolia);