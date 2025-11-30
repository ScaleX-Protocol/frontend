'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useDeposit, formatTokenAmount, needsApproval } from '@/features/home/hooks/useDeposit';
import { useTokenApproval, useTokenAllowance } from '@/features/home/hooks/useTokenApproval';
import { Currency } from '@/features/faucet/types/faucet.types';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

// Transform faucet Currency to Token format and add ETH
const transformCurrenciesToTokens = (currencies: Currency[]): Token[] => {
  const tokens = currencies.map(currency => ({
    address: currency.address,
    symbol: currency.symbol,
    name: currency.name,
    decimals: currency.decimals,
  }));

  // Add ETH as the first token
  const ethToken: Token = {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
  };

  return [ethToken, ...tokens];
};

interface DepositFormProps {
  onSuccess?: (hash: string) => void;
  currencies?: Currency[];
  currenciesLoading?: boolean;
}

export function DepositForm({ onSuccess, currencies = [], currenciesLoading = false }: DepositFormProps) {
  const { user, ready } = usePrivy();
  const address = user?.wallet?.address;
  const isConnected = ready && !!address;

  const availableTokens = useMemo(() => {
    return transformCurrenciesToTokens(currencies);
  }, [currencies]);

  const [selectedToken, setSelectedToken] = useState<Token>(() => {
    // Initialize with ETH fallback
    return {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    };
  });

  // Set default token when currencies load
  useEffect(() => {
    if (availableTokens.length > 0 && selectedToken.address === '0x0000000000000000000000000000000000000000') {
      setSelectedToken(availableTokens[0]);
    }
  }, [availableTokens, selectedToken.address]);
  const [amount, setAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const { deposit, isPending: isDepositing, isConfirming, isConfirmed, error: depositError, hash } = useDeposit({
    onSuccess: (hash) => {
      onSuccess?.(hash);
    },
  });

  const { approve, isPending: isApprovingTx } = useTokenApproval();

  // Get allowance for selected token
  const { data: allowance } = useTokenAllowance(selectedToken.address, address);

  // Get user balance
  const getBalanceHook = useDeposit({});
  const balanceQuery = getBalanceHook.getBalance?.(address || '', selectedToken.address);
  const balance = balanceQuery?.data as bigint | null;

  // Check if approval is needed
  const approvalNeeded = needsApproval(selectedToken.address, amount, selectedToken.decimals, allowance);

  const handleDeposit = async () => {
    if (!address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    // If it's an ERC20 token and approval is needed, approve first
    if (selectedToken.address !== '0x0000000000000000000000000000000000000000' && approvalNeeded) {
      setIsApproving(true);
      try {
        await approve({
          tokenAddress: selectedToken.address,
          amount,
          decimals: selectedToken.decimals,
        });
        setIsApproving(false);
      } catch (error) {
        setIsApproving(false);
        return;
      }
    } else {
      // Proceed with deposit
      await deposit({
        tokenAddress: selectedToken.address,
        amount,
        decimals: selectedToken.decimals,
        recipient: address,
      });
    }
  };

  const handleApprove = async () => {
    if (!address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsApproving(true);
    try {
      await approve({
        tokenAddress: selectedToken.address,
        amount,
        decimals: selectedToken.decimals,
      });
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsApproving(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>Please connect your wallet to deposit funds</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (currenciesLoading && availableTokens.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Loading Tokens</CardTitle>
          <CardDescription>Please wait while we load available tokens...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!currenciesLoading && availableTokens.length === 1) { // Only ETH available
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>No Tokens Available</CardTitle>
          <CardDescription>No additional tokens are available for deposit on this network.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Deposit Funds</CardTitle>
        <CardDescription>
          Deposit tokens into the ScaleX protocol to start earning yield
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Selection */}
        <div className="space-y-2">
          <Label htmlFor="token">Token</Label>
          <select
            value={selectedToken.symbol}
            onChange={(e) => {
              const token = availableTokens.find(t => t.symbol === e.target.value);
              if (token) {
                setSelectedToken(token);
              }
            }}
            className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
            disabled={isDepositing || isConfirming || isApproving || currenciesLoading}
          >
            {availableTokens.map((token) => (
              <option key={token.address} value={token.symbol}>
                {token.name} ({token.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isDepositing || isConfirming || isApproving}
          />
          {balance && (
            <p className="text-sm text-gray-500">
              Current balance: {formatTokenAmount(balance, selectedToken.decimals)} {selectedToken.symbol}
            </p>
          )}
        </div>

        {/* Approval Status */}
        {selectedToken.address !== '0x0000000000000000000000000000000000000000' && (
          <div className="space-y-2">
            {approvalNeeded ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to approve {selectedToken.symbol} before depositing.
                </AlertDescription>
              </Alert>
            ) : allowance && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {selectedToken.symbol} approved: {formatTokenAmount(allowance, selectedToken.decimals)} {selectedToken.symbol}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Error Display */}
        {depositError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{depositError.message}</AlertDescription>
          </Alert>
        )}

        {/* Transaction Status */}
        {isConfirming && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Transaction submitted. Waiting for confirmation...
            </AlertDescription>
          </Alert>
        )}

        {isConfirmed && hash && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Transaction confirmed! Hash: {hash}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {selectedToken.address !== '0x0000000000000000000000000000000000000000' && approvalNeeded && (
            <Button
              onClick={handleApprove}
              disabled={!amount || parseFloat(amount) <= 0 || isApproving || isApprovingTx}
              className="w-full"
              variant="outline"
            >
              {isApproving || isApprovingTx ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                `Approve ${selectedToken.symbol}`
              )}
            </Button>
          )}

          <Button
            onClick={handleDeposit}
            disabled={
              !address ||
              !amount ||
              parseFloat(amount) <= 0 ||
              isDepositing ||
              isConfirming ||
              isApproving ||
              (approvalNeeded && selectedToken.address !== '0x0000000000000000000000000000000000000000')
            }
            className="w-full"
          >
            {isDepositing || isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {approvalNeeded ? 'Approving...' : 'Depositing...'}
              </>
            ) : (
              'Deposit'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}