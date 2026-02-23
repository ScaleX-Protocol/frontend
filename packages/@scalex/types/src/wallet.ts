export type NetworkType = 'EVM' | 'SVM';

export interface WalletDetail {
  address: string;
  isConnected: boolean;
  chainIdOrCluster: number | string;
}

export interface UniversalWalletState {
  isConnected: boolean;
  activeNetwork: NetworkType;
  address: string; // Alamat yang aktif saat ini (EVM atau SVM)
  evm: WalletDetail;
  svm: WalletDetail;
  login: () => void;
  logout: () => void;
}