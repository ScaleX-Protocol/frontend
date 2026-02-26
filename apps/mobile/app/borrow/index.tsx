import { usePrivy } from '@privy-io/expo';
import { useCurrencies } from '@scalex/api';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserCollateral } from '~/src/hooks/deposit/useUserCollateral';
import { usePrivyBorrow } from '~/src/hooks/lending/usePrivyBorrow';
import type { LendingTokenSymbol } from '~/src/lib/solana/lending';
import { getTokenMintPk } from '~/src/lib/solana/pdas';

const BORROW_TOKENS: LendingTokenSymbol[] = ['USDT', 'BTC', 'WETH'];

const TOKEN_DECIMALS: Record<string, number> = {
  USDT: 6,
  BTC: 6,
  WETH: 6,
};

export default function BorrowScreen() {
  const router = useRouter();
  const [selectedTokenSymbol, setSelectedTokenSymbol] = React.useState<string>("USDT");
  const [amount, setAmount] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: currenciesData } = useCurrencies();
  
  const availableTokens = React.useMemo(() => currenciesData?.data?.items || [], [currenciesData?.data?.items]);
  const selectedToken = availableTokens.find((token) => token.symbol === selectedTokenSymbol);

  const { data: userCollateral, isLoading: collateralLoading, refetch: refetchCollateral } = useUserCollateral();

  const selectedMint = React.useMemo(() => {
    try {
      return getTokenMintPk(selectedToken?.name || 'USDT');
    } catch {
      return null;
    }
  }, [selectedToken]);

  const collateralAmountRaw = React.useMemo(() => {
    if (!userCollateral || !selectedMint) return 0n;
    const deposit = userCollateral.deposits.find(
      (d) => d.mint === selectedMint.toBase58()
    );
    return deposit ? deposit.amountRaw : 0n;
  }, [userCollateral, selectedMint]);

  const borrowingPower = React.useMemo(() => {
    const decimals = TOKEN_DECIMALS[selectedToken?.name || 'USDT'] || 6;
    const val = Number(collateralAmountRaw) / Math.pow(10, decimals);
    return val.toFixed(decimals > 2 ? 4 : 2);
  }, [collateralAmountRaw, selectedToken]);

  const { borrow, isPending, error, hash, isAuthenticated } = usePrivyBorrow({
    onSuccess: () => {
      refetchCollateral();
      setAmount('');
    },
    onError: (e) => console.error('[Borrow]', e),
  });

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchCollateral();
    } finally {
      setRefreshing(false);
    }
  }, [refetchCollateral]);

  const handleBorrow = React.useCallback(() => {
    if (!amount || parseFloat(amount) <= 0) return;
    borrow({
      tokenSymbol: selectedToken?.name || 'USDT',
      amount,
      decimals: selectedToken?.decimals || 6,
    });
  }, [amount, selectedToken, borrow]);

  const canBorrow = isAuthenticated && !!amount && parseFloat(amount) > 0 && !isPending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Borrow</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#E26B1D"
              colors={['#E26B1D']}
            />
          }
        >
          <View style={styles.section}>
            <Text style={styles.label}>Select Token</Text>
            <View style={styles.tokenSelector}>
              {availableTokens.map((token) => (
                <TouchableOpacity
                  key={token.symbol}
                  style={[
                    styles.tokenChip,
                    selectedToken === token && styles.tokenChipActive,
                  ]}
                  onPress={() => setSelectedTokenSymbol(token.symbol)}
                >
                  <Text
                    style={[
                      styles.tokenChipText,
                      selectedToken === token && styles.tokenChipTextActive,
                    ]}
                  >
                    {token.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Your Collateral Balance</Text>
            {collateralLoading ? (
              <ActivityIndicator size="small" color="#E26B1D" />
            ) : (
              <Text style={styles.balanceValue}>
                {borrowingPower} {selectedToken?.name}
              </Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#666"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                editable={!isPending}
              />
            </View>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Borrow {selectedToken?.name} against your deposited collateral.
            </Text>
          </View>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          )}
          {hash && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>Borrow confirmed!</Text>
              <Text style={styles.successHash} numberOfLines={1}>{hash}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.actionButton, (!canBorrow || isPending) && styles.actionButtonDisabled]}
            onPress={handleBorrow}
            disabled={!canBorrow || isPending}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={[styles.actionButtonText, (!canBorrow || isPending) && styles.actionButtonTextDisabled]}>
                Borrow {selectedToken?.name}
              </Text>
            )}
          </TouchableOpacity>
          {!isAuthenticated && (
            <Text style={styles.connectHint}>Connect your Solana wallet to borrow</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: { padding: 8, marginRight: 8 },
  backText: { color: '#E26B1D', fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  content: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  label: { fontSize: 14, color: '#888', marginBottom: 8, fontWeight: '500' },
  tokenSelector: { flexDirection: 'row', gap: 12 },
  tokenChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tokenChipActive: { backgroundColor: '#E26B1D20', borderColor: '#E26B1D' },
  tokenChipText: { fontSize: 16, fontWeight: '600', color: '#888' },
  tokenChipTextActive: { color: '#E26B1D' },
  balanceValue: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 18, color: '#FFF', paddingVertical: 16 },
  infoBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  infoText: { fontSize: 13, color: '#888', lineHeight: 20 },
  errorBox: {
    backgroundColor: '#E74C3C20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  errorText: { fontSize: 14, color: '#E74C3C' },
  successBox: {
    backgroundColor: '#2ECC7120',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2ECC71',
  },
  successText: { fontSize: 14, fontWeight: '600', color: '#2ECC71' },
  successHash: { fontSize: 12, color: '#2ECC71', marginTop: 4, opacity: 0.9 },
  actionButton: {
    backgroundColor: '#E26B1D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  actionButtonDisabled: { backgroundColor: '#3A3A3A', opacity: 0.6 },
  actionButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  actionButtonTextDisabled: { color: '#888' },
  connectHint: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 16 },
});
