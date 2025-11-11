export const parseChainId = (chainId: string | undefined): number => {
  if (!chainId) return 0;
  return parseInt(chainId.replace("eip155:", ""));
};