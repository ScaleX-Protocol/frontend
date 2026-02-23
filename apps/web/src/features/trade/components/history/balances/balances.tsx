import { DataTable } from "@/features/trade/components/history/dataTable";
import { getBalancesColumns } from "@/features/trade/components/history/balances/column";
import { useAccount } from "@/features/trade/hooks/history/useAccount";
import { useCurrencies } from "@scalex/api";
import { useWalletState } from "@/hooks/useWalletState";

export default function Balances() {
  const wallet = useWalletState();
  const { data, isLoading, error } = useAccount(wallet.embeddedWallet.address);
  const balances = data?.balances || [];

  // Fetch currencies data to get decimals for each asset
  const { data: currenciesData } = useCurrencies();
  const currencies = currenciesData?.data?.items || [];

  const columns = getBalancesColumns(currencies);

  return (
    <DataTable
      columns={columns}
      data={balances}
      isLoading={isLoading}
      error={error}
      emptyMessage="No assets in your trading account. Deposit funds to start trading!"
      loadingMessage="Loading your portfolio..."
      errorMessage="Unable to load balances. Please refresh the page."
      getRowId={(row) => row.asset}
    />
  );
}

