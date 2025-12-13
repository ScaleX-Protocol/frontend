export const parseChainId = (chainId: string | undefined): number => {
  if (!chainId) return 0;
  return Number(chainId.replace('eip155:', ''));
};
