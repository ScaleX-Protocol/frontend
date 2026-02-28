import { Button, StatusMessage } from '@/components/modals/modalComponents';
import type { BaseModalProps, Token } from '@/types/modal.types';
import { transformCurrenciesToTokens } from '@/utils/currency.helper';
import { AnimatePresence } from 'framer-motion';
import { ArrowDownToLine, Loader2, ChevronUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { erc20Abi } from 'viem';
import { useReadContract } from 'wagmi';
import { formatTokenAmount } from '@/utils/depositUtils';
import { useChainDeposit, DepositStep } from '../../hooks/useChainDeposit';
import { useSolanaBalance } from '@/features/trade/hooks/svm/useSolanaBalance';
import { getBlockExplorerTxUrl } from '@/configs/chain';
import { useWalletState } from '@scalex/service-wallet';
import ModalWrapper from '@/components/modals/modalWrapper';
import { useLogger } from '@/hooks/useLogger';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import { ChainTypeConfig } from '@/configs/chainType';
import { useToast } from '@/hooks/useToast';
import { useWallets } from '@privy-io/react-auth/solana';
import { SolanaConfig } from '@/configs/solana';
import { getTokenMint } from '@/lib/anchor';
import { Transaction } from '@solana/web3.js';
import bs58 from 'bs58';

export function DepositModal({
  isOpen,
  onClose,
  currencies = [],
  currenciesLoading = false,
  onBalanceUpdate,
}: BaseModalProps) {
  const wallet = useWalletState();
  const logger = useLogger();
  const { toast } = useToast();
  const { wallets: solanaWallets } = useWallets();

  const isSolana = ChainTypeConfig.isSolana;

  // Detect if the connected external Solana wallet is on the wrong network (e.g. mainnet vs devnet)
  // externalSolanaWallet = Phantom/Solflare (not Privy)
  // embeddedSolanaWalletRaw = Privy embedded wallet sourced directly from useWallets() (same
  //   source used by useSolanaPlaceOrder — ensures createAnchorWallet receives the right object)
  const externalSolanaWallet = solanaWallets.find((w) => w.standardWallet.name !== 'Privy');
  const embeddedSolanaWalletRaw = solanaWallets.find((w) => w.standardWallet.name === 'Privy');
  const externalWalletChains = externalSolanaWallet?.standardWallet.accounts?.[0]?.chains ?? [];
  const isExternalWalletWrongNetwork =
    isSolana &&
    !!externalSolanaWallet &&
    externalWalletChains.length > 0 &&
    !externalWalletChains.includes(SolanaConfig.chainId as `${string}:${string}`);

  // Use external wallet address if connected, otherwise embedded wallet.
  // For Solana: external = Phantom/Solflare, embedded = Privy.
  // The deposit will also use this same wallet so balance and signing stay in sync.
  const address = wallet.externalWallet.address !== 'Not Connected'
    ? wallet.externalWallet.address
    : wallet.embeddedWallet.address;

  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);

  const availableTokens = useMemo(() => {
    return transformCurrenciesToTokens(currencies);
  }, [currencies]);

  // Store selected index instead of token object for better reactivity
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(1);

  // Derive selected token from index - auto-updates when tokens change
  const selectedToken = useMemo(() => {
    return (
      availableTokens[selectedTokenIndex] ||
      availableTokens[0] || {
        address: '0x036CbD53842c5426634d7926b90d857C835a21FB',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
      }
    );
  }, [availableTokens, selectedTokenIndex]);

  // Format display name for the dropdown
  const getDisplayName = (token: Token) => {
    return `${token.name || token.symbol} (${token.symbol})`;
  };

  // Reset to first token when modal opens
  useEffect(() => {
    if (isOpen && availableTokens.length > 1) {
      logger.log(
        LogLevel.INFO,
        'Deposit modal opened',
        LogLabel.USER,
        ServiceName.WEBAPP,
        {
          availableTokens: availableTokens.length,
          walletAddress: address,
        },
        'depositModal.tsx',
        'useEffect',
      );
      setSelectedTokenIndex(1);
    }
  }, [isOpen, availableTokens.length, address]);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setIsDropdownOpen(false);
      setNetworkWarning(null);

      // Check network on modal open (EVM only)
      if (!isSolana && wallet.externalWallet.address && (window as any).ethereum) {
        (window as any).ethereum
          .request({ method: 'eth_chainId' })
          .then((chainIdHex: string) => {
            const currentChainId = parseInt(chainIdHex, 16);
            if (currentChainId !== 84532) {
              const getChainName = (id: number): string => {
                switch (id) {
                  case 84532: return 'Base Sepolia';
                  case 8453: return 'Base Mainnet';
                  case 1: return 'Ethereum Mainnet';
                  case 11155111: return 'Sepolia Testnet';
                  default: return `Chain ${id}`;
                }
              };
              setNetworkWarning(
                `Your wallet is connected to ${getChainName(currentChainId)}. Please switch to Base Sepolia.`
              );
            }
          })
          .catch(() => {
            // Ignore errors
          });
      }
    } else {
      setTimeout(() => {
        setAmount('');
        setIsDropdownOpen(false);
        setNetworkWarning(null);
      }, 300);
    }
  }, [isOpen, wallet.externalWallet.address, isSolana]);

  const {
    deposit,
    isPending: isDepositing,
    error: depositError,
    currentStep,
  } = useChainDeposit({
    onSuccess: (hash) => {
      logger.log(
        LogLevel.INFO,
        'Deposit transaction successful',
        LogLabel.DEPOSIT,
        ServiceName.WEBAPP,
        {
          txHash: hash,
          source: 'deposit_modal',
        },
        'depositModal.tsx',
        'handleSuccess',
      );

      // Store transaction hash for display
      setTransactionHash(hash);

      // Reset form on success
      setAmount('');

      // Refetch balance data to show updated balance
      if (onBalanceUpdate) {
        logger.log(
          LogLevel.INFO,
          'Refetching balance data after successful deposit',
          LogLabel.DEPOSIT,
          ServiceName.WEBAPP,
          {
            txHash: hash,
          },
          'depositModal.tsx',
          'handleSuccess',
        );
        onBalanceUpdate();
      }

      // Clear transaction hash after 10 seconds
      setTimeout(() => setTransactionHash(null), 10000);

      // Optional: close panel after success
      setTimeout(() => onClose(), 3000);
    },
    onError: (error) => {
      logger.logError(
        'Deposit transaction failed',
        {
          error: error.message || error,
          source: 'deposit_modal',
        },
        'handleError',
        'depositModal.tsx',
      );

      // Show user-friendly toast for network mismatch errors
      if (error.message?.includes('switch your wallet to Base Sepolia')) {
        toast({
          title: 'Wrong Network',
          description: error.message,
          variant: 'warning',
          duration: 8000,
        });
      }
    },
  });

  // ── EVM: Get user balance via ERC20 balanceOf ──
  const { data: evmBalance } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !isSolana && !!address && !!selectedToken.address,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // ── Solana: Get user balance via ATA (Associated Token Account) ──
  // Use the Solana mint address from the token registry (not selectedToken.address which is an EVM address).
  const solanaMint = isSolana ? getTokenMint(selectedToken.symbol)?.toBase58() : undefined;
  const solanaBalance = useSolanaBalance({
    userAddress: isSolana ? address : undefined,
    tokenMint: solanaMint,
    decimals: selectedToken.decimals,
    enabled: isSolana && !!address && !!solanaMint,
  });

  // Log balance fetch parameters for debugging
  logger.log(LogLevel.DEBUG, 'Balance fetch parameters', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
    userAddress: address,
    tokenAddress: selectedToken.address,
    tokenSymbol: selectedToken.symbol,
    tokenDecimals: selectedToken.decimals,
    chainType: isSolana ? 'solana' : 'evm',
  }, 'depositModal.tsx', 'balanceFetch');

  // Formatted available balance — chain-aware
  const availableBalance = useMemo(() => {
    if (isSolana) {
      return solanaBalance.formattedBalance > 0
        ? solanaBalance.formattedBalance.toFixed(Math.min(selectedToken.decimals, 6))
        : '0';
    }
    if (evmBalance !== undefined && evmBalance !== null) {
      return formatTokenAmount(evmBalance, selectedToken.decimals);
    }
    return '0';
  }, [isSolana, evmBalance, solanaBalance.formattedBalance, selectedToken.decimals]);

  const handleDeposit = async () => {
    if (!wallet.isReady || !address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      if (isSolana) {
        type SolanaWallet = {
          address: string;
          signTransaction: (tx: unknown) => Promise<unknown>;
          sendTransaction?: (tx: unknown, connection: unknown) => Promise<string>;
        };
        // Use the embedded wallet directly from useWallets() — same source as useSolanaPlaceOrder.
        // This ensures createAnchorWallet receives the correct ConnectedSolanaWallet object.
        const embeddedWallet = embeddedSolanaWalletRaw as SolanaWallet | undefined;

        const hasExternal =
          !!externalSolanaWallet &&
          wallet.externalSolanaWallet?.address !== 'Not Connected';

        console.log('[deposit] wallet resolution', {
          hasExternal,
          externalAddress: externalSolanaWallet?.address,
          embeddedAddress: embeddedSolanaWalletRaw?.address,
          embeddedName: embeddedSolanaWalletRaw?.standardWallet?.name,
          fallbackEmbedded: wallet.embeddedSolanaWallet?.address,
        });

        if (!embeddedWallet && !hasExternal) {
          throw new Error('No Solana wallet available');
        }

        if (hasExternal && embeddedWallet) {
          // Dual-wallet flow: external signs+sends SPL transfer → embedded, then embedded deposits.
          // ConnectedSolanaWallet.signTransaction causes "e is not iterable" in Privy's wrapper,
          // so we bypass it and call the raw Wallet Standard feature directly.
          const stdFeature = externalSolanaWallet.standardWallet?.features?.['solana:signAndSendTransaction'] as
            | { signAndSendTransaction: (...args: unknown[]) => Promise<unknown> }
            | undefined;
          const signOnlyFeature = externalSolanaWallet.standardWallet?.features?.['solana:signTransaction'] as
            | { signTransaction: (...args: unknown[]) => Promise<unknown> }
            | undefined;
          const account = externalSolanaWallet.standardWallet?.accounts?.[0];

          console.log('[deposit] dual-wallet flow', {
            externalAddress: externalSolanaWallet.address,
            embeddedAddress: embeddedWallet.address,
            walletName: externalSolanaWallet.standardWallet?.name,
            availableFeatures: Object.keys(externalSolanaWallet.standardWallet?.features ?? {}),
            hasSignAndSend: !!stdFeature?.signAndSendTransaction,
            hasSignOnly: !!signOnlyFeature?.signTransaction,
            hasAccount: !!account,
            chainId: SolanaConfig.chainId,
          });

          const externalAdapter: SolanaWallet = {
            address: externalSolanaWallet.address,
            signTransaction: async (tx: unknown) => tx, // unused in dual-wallet path
            sendTransaction: async (tx: unknown, conn: unknown): Promise<string> => {
              if (!account) throw new Error('External wallet has no connected account');
              const txObj = tx as Transaction;
              const txBytes: Uint8Array = txObj.serialize({ requireAllSignatures: false });
              console.log('[deposit] externalAdapter.sendTransaction called', { txByteLength: txBytes.length });

              // Prefer signAndSendTransaction (sign + submit in one round-trip)
              if (stdFeature?.signAndSendTransaction) {
                console.log('[deposit] using solana:signAndSendTransaction');
                const result = await stdFeature.signAndSendTransaction({
                  account,
                  transaction: txBytes,
                  chain: SolanaConfig.chainId,
                });
                console.log('[deposit] signAndSendTransaction raw result:', result);
                const res = Array.isArray(result) ? result[0] : result;
                const rawSig = (res as { signature?: Uint8Array | string })?.signature;
                console.log('[deposit] extracted signature (raw):', rawSig);
                if (rawSig) {
                  // Wallet Standard returns Uint8Array bytes; convert to base58 string for RPC calls
                  const sig = typeof rawSig === 'string' ? rawSig : bs58.encode(rawSig);
                  console.log('[deposit] signature (base58):', sig);
                  return sig;
                }
                console.warn('[deposit] signAndSendTransaction returned no signature, falling through to signOnly');
              }

              // Fallback: signTransaction then sendRawTransaction
              if (signOnlyFeature?.signTransaction) {
                console.log('[deposit] using solana:signTransaction fallback');
                const rawResult = await signOnlyFeature.signTransaction({
                  account,
                  transaction: txBytes,
                });
                console.log('[deposit] signTransaction raw result type:', typeof rawResult, 'isArray:', Array.isArray(rawResult));
                const output = Array.isArray(rawResult) ? (rawResult as unknown[])[0] : rawResult;
                const signedBytes = (output as { signedTransaction?: Uint8Array })?.signedTransaction;
                if (!signedBytes) {
                  throw new Error(`Wallet Standard signing returned unexpected format: ${JSON.stringify(rawResult)}`);
                }
                console.log('[deposit] signedBytes length:', signedBytes.length);
                const signedTx = Transaction.from(signedBytes);
                const connection = conn as { sendRawTransaction: (bytes: Uint8Array, opts: object) => Promise<string> };
                const txSig = await connection.sendRawTransaction(signedTx.serialize(), {
                  skipPreflight: false,
                  preflightCommitment: 'confirmed',
                });
                console.log('[deposit] sendRawTransaction sig:', txSig);
                return txSig;
              }

              throw new Error('External wallet does not support signAndSendTransaction or signTransaction (Wallet Standard)');
            },
          };

          await (deposit as (p: {
            tokenSymbol: string; amount: string; decimals: number;
            wallet: SolanaWallet; embeddedWallet: SolanaWallet;
          }) => Promise<void>)({
            tokenSymbol: selectedToken.symbol,
            amount,
            decimals: selectedToken.decimals,
            wallet: externalAdapter,
            embeddedWallet,
          });
        } else {
          // Single-wallet flow: embedded (or external if no embedded) deposits directly
          const signerWallet = (embeddedWallet ?? (hasExternal ? { address: externalSolanaWallet!.address, signTransaction: externalSolanaWallet!.signTransaction } as SolanaWallet : undefined))!;
          await (deposit as (p: {
            tokenSymbol: string; amount: string; decimals: number; wallet: SolanaWallet;
          }) => Promise<void>)({
            tokenSymbol: selectedToken.symbol,
            amount,
            decimals: selectedToken.decimals,
            wallet: signerWallet,
          });
        }
      } else {
        await (deposit as (p: { tokenAddress: string; amount: string; decimals: number; recipient: string }) => Promise<void>)({
          tokenAddress: selectedToken.address,
          amount,
          decimals: selectedToken.decimals,
          recipient: wallet.embeddedWallet.address,
        });
      }
    } catch (error: any) {
      logger.logError('Deposit failed', { error: error?.message || error }, 'handleDeposit', 'depositModal.tsx');
    }
  };

  // Handle percentage button clicks
  const handlePercentageClick = (percentage: number) => {
    const balanceNum = parseFloat(availableBalance);
    if (balanceNum > 0) {
      const newAmount = (balanceNum * percentage / 100).toFixed(selectedToken.decimals > 6 ? 6 : selectedToken.decimals);
      setAmount(newAmount);
    }
  };

  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(availableBalance);
  const isInsufficientBalance = !isNaN(amountNum) && !isNaN(balanceNum) && amountNum > balanceNum;

  const isDisabled =
    !wallet.isReady || !address || !amount || amountNum <= 0 || isInsufficientBalance || isExternalWalletWrongNetwork || isDepositing || currenciesLoading;

  // Check if amount has value for styling
  const hasValue = amount && parseFloat(amount) > 0;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Deposit Asset"
      icon={ArrowDownToLine}
      isProcessing={isDepositing}
    >
      {/* Content */}
      <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-240px)] overflow-y-auto">
        {/* Network Warning */}
        {networkWarning && (
          <div className="p-3 rounded-[10px] bg-amber-900/20 border border-amber-500/30">
            <p className="text-amber-400 text-sm font-medium flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {networkWarning}
            </p>
          </div>
        )}

        {/* Token Selection */}
        <div>
          <label htmlFor="token-select" className="text-[#A0A0A0] text-sm block mb-2">
            Select Asset
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => !isDepositing && !currenciesLoading && setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 bg-[#111111] border border-[#E0E0E0]/20 rounded-[10px] text-[#E0E0E0] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              disabled={isDepositing || currenciesLoading}
            >
              <span>
                {currenciesLoading ? 'Loading...' : getDisplayName(selectedToken)}
              </span>
              <ChevronUp
                className={`w-5 h-5 text-[#E0E0E0]/40 transition-transform ${isDropdownOpen ? '' : 'rotate-180'}`}
              />
            </button>
            {isDropdownOpen && availableTokens.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#111111] border border-[#E0E0E0]/20 rounded-[10px] overflow-hidden z-10 max-h-48 overflow-y-auto">
                {availableTokens.map((token, index) => (
                  <button
                    key={token.address}
                    type="button"
                    onClick={() => {
                      setSelectedTokenIndex(index);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-[#E0E0E0] hover:bg-[#252525] transition-colors ${index === selectedTokenIndex ? 'bg-[#252525]' : ''
                      }`}
                  >
                    {getDisplayName(token)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[#A0A0A0] text-sm leading-[16px]">Amount</label>
            <span className="text-[#666666] text-sm leading-[16px]">
              Available: {availableBalance} {selectedToken.symbol}
            </span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              // Allow empty, numbers, and decimal point
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setAmount(value);
              }
            }}
            disabled={isDepositing}
            className={`w-full px-4 py-3 bg-[#111111] border border-[#E0E0E0]/20 rounded-[10px] text-[#E0E0E0] placeholder-[#666666] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${hasValue ? 'border-[#F06718]' : 'border-[#E0E0E0]/20 focus:border-[#F06718]'
              }`}
          />

          {/* Percentage Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[25, 50, 75].map((percent) => (
              <button
                key={percent}
                type="button"
                onClick={() => handlePercentageClick(percent)}
                disabled={isDepositing || parseFloat(availableBalance) === 0}
                className="px-3 py-1.5 bg-transparent border border-[#FFFFFF]/16 rounded-[8px] text-[#E0E0E0] text-sm font-medium hover:bg-[#252525] hover:border-[#E0E0E0]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {percent}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePercentageClick(100)}
              disabled={isDepositing || parseFloat(availableBalance) === 0}
              className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${hasValue && amount === availableBalance
                ? 'bg-[#1A1A1A] border-[#E0E0E0]/50 text-[#E0E0E0]'
                : 'bg-transparent border-[#E0E0E0]/30 text-[#E0E0E0] hover:bg-[#252525] hover:border-[#E0E0E0]/50'
                }`}
            >
              Max
            </button>
          </div>
        </div>

        {/* Insufficient balance warning */}
        {isInsufficientBalance && (
          <p className="text-red-400 text-xs mt-1">
            Insufficient balance. Available: {availableBalance} {selectedToken.symbol}
          </p>
        )}

        {/* Wrong network warning */}
        {isExternalWalletWrongNetwork && (
          <div className="p-3 rounded-[10px] bg-amber-900/20 border border-amber-500/30">
            <p className="text-amber-400 text-sm font-medium">
              ⚠️ Your wallet is on the wrong network. Please switch to <strong>{SolanaConfig.defaultCluster}</strong> in your wallet extension (e.g. Phantom → Settings → Change Network).
            </p>
          </div>
        )}

        {/* Deposit Info */}
        <div className="p-3 rounded-[10px] bg-[#1A1A1A] border border-[#E0E0E0]/10">
          <p className="text-[#A0A0A0] text-xs leading-[16px] font-light">
            Depositing assets will transfer them from your wallet to the lending protocol. You can withdraw anytime.
          </p>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {currentStep === DepositStep.APPROVING && (
            <StatusMessage type="loading-approve" title="Approving Token" message="Please confirm in your wallet" />
          )}

          {currentStep === DepositStep.CONFIRMING && (
            <StatusMessage type="loading-process" title="Processing Deposit" message="Waiting for confirmation..." />
          )}

          {currentStep === DepositStep.SYNCING && (
            <StatusMessage type="loading-process" title="Syncing Indexer" message="Waiting for balance to update..." />
          )}

          {currentStep === DepositStep.COMPLETED && (
            <StatusMessage type="success" title="Deposit Confirmed!" message="Your assets have been deposited" />
          )}

          {currentStep === DepositStep.ERROR && depositError && (
            <StatusMessage type="error" title="Deposit Failed" message={depositError.message} />
          )}
        </AnimatePresence>

        {/* Transaction Success */}
        {transactionHash && (
          <div className="p-2 rounded bg-green-900/20 border border-green-500/20 mt-4">
            <div className="flex flex-col gap-1 text-green-400">
              <span className="text-sm font-medium">✓ Transaction Successful!</span>
              <a
                href={getBlockExplorerTxUrl(transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-300 hover:text-green-200 underline break-all"
              >
                {transactionHash}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-[#1F1F1F]">
        {!wallet.isConnected ? (
          <Button onClick={() => wallet.login()} variant="primary">
            Connect Wallet
          </Button>
        ) : (
          <Button onClick={handleDeposit} disabled={isDisabled} variant="primary">
            {isDepositing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {currentStep === DepositStep.APPROVING && 'Approving...'}
                {currentStep === DepositStep.DEPOSITING && 'Processing...'}
                {currentStep === DepositStep.SYNCING && 'Syncing...'}
              </span>
            ) : (
              'Deposit'
            )}
          </Button>
        )}
      </div>
    </ModalWrapper>
  );
}
