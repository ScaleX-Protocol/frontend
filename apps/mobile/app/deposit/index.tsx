import { usePrivy } from '@privy-io/expo';
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
import { useCurrencies } from '@scalex/api';

export default function DepositScreen() {
  const router = useRouter();
  const { isReady, user } = usePrivy();
  const [selectedTokenSymbol, setSelectedTokenSymbol] = React.useState<string>("USDT");
  const [amount, setAmount] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: currenciesData } = useCurrencies();

  const availableTokens = React.useMemo(() => currenciesData?.data?.items || [], [currenciesData?.data?.items]);
  const selectedToken = availableTokens.find((token) => token.symbol === selectedTokenSymbol);

  const formattedBalance = 0;

  const canDeposit =
    !!amount &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= parseFloat(formattedBalance || '0');

  const balanceNum = parseFloat(formattedBalance || '0');
  const amountNum = parseFloat(amount || '0');
  const hasInsufficientBalance = amountNum > 0 && amountNum > balanceNum;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
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
              tintColor="#E26B1D"
              colors={['#E26B1D']}
            />
          }
        >
          {/* Token selector */}
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

          {/* Balance */}
          <View style={styles.section}>
            <Text style={styles.label}>Wallet Balance</Text>
            <Text style={styles.balanceValue}>
              {formattedBalance} {selectedToken?.symbol}
            </Text>
          </View>

          {/* Amount input */}
          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  hasInsufficientBalance && styles.inputError,
                ]}
                placeholder="0.00"
                placeholderTextColor="#666"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={styles.maxButton}
                disabled={balanceNum <= 0}
              >
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            {hasInsufficientBalance && (
              <Text style={styles.errorText}>Insufficient balance</Text>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Deposit {selectedToken?.symbol} to receive synthetic tokens for trading on ScaleX.
            </Text>
          </View>

          {/* Deposit button */}
          <TouchableOpacity
            style={[
              styles.depositButton,
              (!canDeposit) && styles.depositButtonDisabled,
            ]}
            disabled={!canDeposit}
          >
            <Text
              style={[
                styles.depositButtonText,
                (!canDeposit) && styles.depositButtonTextDisabled,
              ]}
            >
              Deposit {selectedToken?.symbol}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backText: {
    color: '#E26B1D',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    fontWeight: '500',
  },
  tokenSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  tokenChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tokenChipActive: {
    backgroundColor: '#E26B1D20',
    borderColor: '#E26B1D',
  },
  tokenChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  tokenChipTextActive: {
    color: '#E26B1D',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#FFF',
    paddingVertical: 16,
  },
  inputError: {
    borderColor: '#E74C3C',
  },
  maxButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E26B1D',
    borderRadius: 8,
  },
  maxButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  infoBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  infoText: {
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#E74C3C20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
  },
  successBox: {
    backgroundColor: '#2ECC7120',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2ECC71',
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ECC71',
  },
  successHash: {
    fontSize: 12,
    color: '#2ECC71',
    marginTop: 4,
    opacity: 0.9,
  },
  depositButton: {
    backgroundColor: '#E26B1D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  depositButtonDisabled: {
    backgroundColor: '#3A3A3A',
    opacity: 0.6,
  },
  depositButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  depositButtonTextDisabled: {
    color: '#888',
  },
  connectHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
});
