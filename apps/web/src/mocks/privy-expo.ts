// Stub for @privy-io/expo in web builds.
// The real package is Expo/React Native only. This stub prevents Vite from
// trying to process mobile-only code (including expo-apple-authentication).
export default {};
export const usePrivy = () => { throw new Error('@privy-io/expo is not supported on web. Use @privy-io/react-auth instead.'); };
export const useEmbeddedSolanaWallet = () => { throw new Error('@privy-io/expo is not supported on web.'); };
export const useEmbeddedEthereumWallet = () => { throw new Error('@privy-io/expo is not supported on web.'); };
export const isConnected = () => false;
export const isNotCreated = () => false;
