import type { Currency } from './currency';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies?: Currency[];
  currenciesLoading?: boolean;
  onBalanceUpdate?: () => void;
}
