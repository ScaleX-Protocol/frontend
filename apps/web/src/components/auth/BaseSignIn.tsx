import { useState } from 'react';
import { useBaseAccountSdk } from '@privy-io/react-auth';
import { SignInWithBaseButton } from '@base-org/account-ui/react';
import { Endpoints } from '@/configs/endpoints';

interface VerificationResult {
  success: boolean;
  address: string;
  message: string;
  timestamp: string;
}

export function BaseSignIn() {
  const { baseAccountSdk } = useBaseAccountSdk();
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const provider = baseAccountSdk?.getProvider();

  const handleSignInWithBase = async () => {
    if (!provider) {
      setError('Base Account SDK not available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setVerificationResult(null);

      // Get a fresh nonce from backend
      const nonceResponse = await fetch(`${Endpoints.api}/auth/nonce`);
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce from server');
      }
      const { nonce } = await nonceResponse.json();

      // Connect and authenticate with SIWE
      const response = (await provider.request({
        method: 'wallet_connect',
        params: [
          {
            version: '1',
            capabilities: {
              signInWithEthereum: {
                nonce,
                chainId: '0x2105', // Base mainnet
              },
            },
          },
        ],
      })) as {
        accounts: Array<{
          address: string;
          capabilities: {
            signInWithEthereum: { message: string; signature: string };
          };
        }>;
      };

      const { address } = response.accounts[0];
      const { message, signature } = response.accounts[0].capabilities.signInWithEthereum;

      // Verify signature with backend
      const verifyResponse = await fetch(`${Endpoints.api}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message, signature }),
      });

      const result = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      setVerificationResult(result);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <SignInWithBaseButton
          colorScheme="dark"
          onClick={handleSignInWithBase}
          disabled={loading || !provider}
        />
      </div>

      {loading && (
        <div className="text-center text-blue-400 text-sm">
          Signing in with Base Account...
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {verificationResult && (
        <div className="bg-green-900/20 border border-green-500 text-green-400 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">✅ Successfully Verified!</h4>
          <div className="text-sm space-y-1">
            <div>
              <strong>Address:</strong> {verificationResult.address}
            </div>
            <div>
              <strong>Verified at:</strong>{' '}
              {new Date(verificationResult.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
