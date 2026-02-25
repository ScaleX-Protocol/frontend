import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { useCallback, useState } from 'react';

export interface WorldIdProof {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
}

export function useWorldId() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [proof, setProof] = useState<WorldIdProof | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (
    action: string,
    signal?: string,
    verificationLevel: VerificationLevel = VerificationLevel.Orb,
  ): Promise<WorldIdProof> => {
    if (!MiniKit.isInstalled()) {
      throw new Error('World ID verification is only available inside World App');
    }

    setIsVerifying(true);
    setError(null);

    try {
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action,
        signal: signal ?? '0x0',
        verification_level: verificationLevel,
      });

      if (finalPayload.status === 'error') {
        throw new Error((finalPayload as any).details ?? 'World ID verification failed');
      }

      const result: WorldIdProof = {
        proof: finalPayload.proof,
        merkle_root: finalPayload.merkle_root,
        nullifier_hash: finalPayload.nullifier_hash,
        verification_level: finalPayload.verification_level,
      };

      setProof(result);
      return result;
    } catch (err: any) {
      const msg = err.message || 'Verification failed';
      setError(msg);
      throw err;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return {
    verify,
    isVerifying,
    proof,
    isVerified: !!proof,
    error,
    clearError: () => setError(null),
  };
}
