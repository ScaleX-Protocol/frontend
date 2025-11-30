import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDeposit } from '@/features/home/hooks/useDeposit';
import { useTokenApproval } from '@/features/home/hooks/useTokenApproval';
import { validateDepositParams, validateTokenAmount, parseContractError } from '@/utils/depositUtils';
import { parseUnits } from 'viem';

// Mock wagmi
vi.mock('wagmi', () => ({
  useWriteContract: vi.fn(() => ({
    writeContract: vi.fn(),
    data: null,
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    isLoading: false,
    isSuccess: false,
  })),
  useReadContract: vi.fn(() => ({
    data: null,
  })),
  useAccount: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890',
  })),
  useChainId: vi.fn(() => ({
    chainId: 84532,
  })),
}));

describe('Deposit Utilities', () => {
  describe('validateTokenAmount', () => {
    it('should validate a correct amount', () => {
      const result = validateTokenAmount('1.5', 18);
      expect(result.isValid).toBe(true);
      expect(result.amountInWei).toBe(parseUnits('1.5', 18));
    });

    it('should reject invalid amount', () => {
      const result = validateTokenAmount('abc', 18);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid amount');
    });

    it('should reject zero amount', () => {
      const result = validateTokenAmount('0', 18);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Amount must be greater than 0');
    });

    it('should reject negative amount', () => {
      const result = validateTokenAmount('-1', 18);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Amount must be greater than 0');
    });

    it('should check against max balance', () => {
      const maxBalance = parseUnits('10', 18);
      const result = validateTokenAmount('15', 18, maxBalance);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Insufficient balance. Available: 10.0');
    });
  });

  describe('validateDepositParams', () => {
    it('should validate correct parameters', () => {
      const result = validateDepositParams({
        tokenAddress: '0x1234567890123456789012345678901234567890',
        amount: '1.5',
        decimals: 18,
        recipient: '0x0987654321098765432109876543210987654321',
      });

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid token address', () => {
      const result = validateDepositParams({
        tokenAddress: 'invalid',
        amount: '1.5',
        decimals: 18,
        recipient: '0x0987654321098765432109876543210987654321',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid token address');
    });

    it('should reject invalid amount', () => {
      const result = validateDepositParams({
        tokenAddress: '0x1234567890123456789012345678901234567890',
        amount: 'invalid',
        decimals: 18,
        recipient: '0x0987654321098765432109876543210987654321',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid amount');
    });

    it('should reject invalid recipient', () => {
      const result = validateDepositParams({
        tokenAddress: '0x1234567890123456789012345678901234567890',
        amount: '1.5',
        decimals: 18,
        recipient: 'invalid',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid recipient address');
    });
  });

  describe('parseContractError', () => {
    it('should parse InsufficientBalance error', () => {
      const error = {
        message: 'InsufficientBalance',
      };

      const result = parseContractError(error);
      expect(result.message).toBe('Insufficient balance for this transaction');
      expect(result.code).toBe('INSUFFICIENT_BALANCE');
    });

    it('should parse user rejection error', () => {
      const error = {
        message: 'User denied transaction',
      };

      const result = parseContractError(error);
      expect(result.message).toBe('Transaction was rejected by user');
      expect(result.code).toBe('USER_REJECTED');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');

      const result = parseContractError(error);
      expect(result.message).toBe('Unknown error');
      expect(result.code).toBe('TRANSACTION_FAILED');
    });
  });
});

describe('useDeposit Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize correctly', () => {
    const { result } = renderHook(() => useDeposit());

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.deposit).toBe('function');
    expect(typeof result.current.getBalance).toBe('function');
  });

  it('should handle deposit function call', async () => {
    const { result } = renderHook(() => useDeposit());

    const mockWriteContract = vi.fn();
    vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
      writeContract: mockWriteContract,
      data: null,
    });

    await expect(
      result.current.deposit({
        tokenAddress: '0x0000000000000000000000000000000000000000',
        amount: '1',
        decimals: 18,
        recipient: '0x1234567890123456789012345678901234567890',
      })
    ).rejects.toThrow();

    expect(mockWriteContract).toHaveBeenCalled();
  });
});

describe('useTokenApproval Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize correctly', () => {
    const { result } = renderHook(() => useTokenApproval());

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.approve).toBe('function');
  });

  it('should handle approval function call', async () => {
    const { result } = renderHook(() => useTokenApproval());

    const mockWriteContract = vi.fn();
    vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
      writeContract: mockWriteContract,
      data: null,
    });

    await expect(
      result.current.approve({
        tokenAddress: '0x1234567890123456789012345678901234567890',
        amount: '100',
        decimals: 6,
      })
    ).rejects.toThrow();

    expect(mockWriteContract).toHaveBeenCalled();
  });
});