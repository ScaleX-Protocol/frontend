import { DataTable } from "@/features/trade/components/history/dataTable";
import { getBalancesColumns } from "@/features/trade/components/history/balances/column";
import { useAccount } from "@/features/trade/hooks/history/useAccount";
import { useWalletState } from "@/hooks/useWalletState";

export default function Balances() {
  const wallet = useWalletState();
  const { data, isLoading, error } = useAccount(wallet.embeddedWallet.address);
  const balances = data?.balances || [];
  const columns = getBalancesColumns();

  return (
    <DataTable
      columns={columns}
      data={balances}
      isLoading={isLoading}
      error={error}
      emptyMessage="No balances found"
      loadingMessage="Loading balances..."
      errorMessage="Error loading balances"
      getRowId={(row) => row.asset}
    />
  );
}
