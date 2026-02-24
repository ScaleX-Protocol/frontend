// Import polyfills first
import '../../polyfills';

import { isConnected, useEmbeddedWallet, usePrivy } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useLogin } from '@privy-io/expo/ui';
import * as React from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { usePortfolioSummary } from '~/src/hooks/home/use-portfolio-summary';
import { useLendingDashboard } from '~/src/hooks/lending/useLendingDashboard';
import DepositIcon from '../../assets/icon/ic_deposit.svg';
import EarnIcon from '../../assets/icon/ic_earn.svg';
import LiquidityIcon from '../../assets/icon/ic_liquidity.svg';
import MarketIcon from '../../assets/icon/ic_market.svg';
import PortfolioIcon from '../../assets/icon/ic_portfolio.svg';
import WithdrawIcon from '../../assets/icon/ic_withdraw.svg';
import { ChainConfig } from '@scalex/service-wallet';
import { SkeletonBalanceCard, SkeletonLendingSummary } from '../../components/ui/skeleton-loader';

export default function HomeScreen() {
  const router = useRouter();
  const privyHook = usePrivy();
  const { isReady, user, logout } = privyHook;
  const wallet = useEmbeddedWallet();
  const { login } = useLogin();
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // Get wallet address when connected
  React.useEffect(() => {
    if (wallet && isConnected(wallet)) {
      // Try to get address from wallet account first
      const address = wallet.account?.address;
      if (address) {
        setWalletAddress(address);
      } else {
        // Fallback to eth_accounts request
        wallet.provider.request({ method: 'eth_accounts' })
          .then((accounts: any) => {
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
            }
          })
          .catch(console.error);
      }
    } else {
      setWalletAddress(null);
    }
  }, [wallet]);

  // Fetch lending dashboard data using walletAddress from state
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isFetching: isDashboardFetching,
    refetch: refetchDashboard,
    error: dashboardError,
  } = useLendingDashboard(
    { user: walletAddress || '', chainId: ChainConfig.defaultChainId },
    { enabled: !!walletAddress }
  );

  // Fetch portfolio summary
  const {
    assets,
    isLoading: isPortfolioLoading,
    isFetching: isPortfolioFetching,
    refetch: refetchPortfolio
  } = usePortfolioSummary();

  // Calculate portfolio value from assets
  const portfolioValue = React.useMemo(() => {
    if (!assets || assets.length === 0) return '0.00';
    const total = assets.reduce((sum, asset) => sum + asset.usdValue, 0);
    return total.toFixed(2);
  }, [assets]);

  // Extract lending data with fallbacks
  const netAPY = dashboardData?.summary?.netAPY?.toString() || '0.00';
  const healthFactor = dashboardData?.summary?.healthFactor
    ? (dashboardData.summary.healthFactor === 'Infinity' ? '∞' : dashboardData.summary.healthFactor.toString())
    : '∞';
  const totalSupplied = dashboardData?.summary?.totalSupplied?.toString() || '0.00';
  const totalBorrowed = dashboardData?.summary?.totalBorrowed?.toString() || '0.00';
  const topMarkets: any[] = [];

  // Show skeleton during initial load OR when refetching (pull-to-refresh)
  const isLoading = isDashboardLoading || isPortfolioLoading || isDashboardFetching || isPortfolioFetching;

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchDashboard(), refetchPortfolio()]);
    } catch (error) {
      console.error('[Home] Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchDashboard, refetchPortfolio]);

  const handleConnectPress = async () => {
    try {
      if (user) {
        await logout();
      } else {
        login({
          loginMethods: ['google', 'twitter', 'email'],
        });
      }
    } catch (error) {
      console.error('[Home] Error in handleConnectPress:', error);
    }
  };

  const getButtonText = () => {
    if (!isReady) return 'Loading...';

    // Check if user is authenticated and has a wallet address
    if (user && walletAddress) {
      return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    }

    // User is authenticated but wallet not connected
    if (user) {
      return 'Connected';
    }

    return 'Connect';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#E26B1D"
            colors={['#E26B1D']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/ScaleX.webp')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logo}>ScaleX</Text>
          </View>
          <TouchableOpacity
            style={[styles.connectButton, !isReady && styles.connectButtonDisabled]}
            onPress={handleConnectPress}
            disabled={!isReady}
          >
            <Text style={styles.connectButtonText}>{getButtonText()}</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        {isLoading ? (
          <SkeletonBalanceCard />
        ) : (
          <View style={styles.balanceCard}>
            <View style={styles.balanceBackground}>
              {/* Gradient Background Effect */}
              <Svg
                width="300"
                height="300"
                style={{ position: 'absolute', top: -150, right: -150 }}
              >
                <Defs>
                  <RadialGradient id="grad" cx="50%" cy="50%">
                    <Stop offset="0%" stopColor="#E26B1D" stopOpacity="0.15" />
                    <Stop offset="50%" stopColor="#E26B1D" stopOpacity="0.05" />
                    <Stop offset="100%" stopColor="#E26B1D" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="150" cy="150" r="150" fill="url(#grad)" />
              </Svg>

              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Total Portfolio Value</Text>
              </View>
              <Text style={styles.balanceAmount}>
                ${portfolioValue} <Text style={styles.balanceUSD}>USD</Text>
              </Text>

              {/* Action Buttons inside card */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.depositButton}
                  onPress={() => router.push('/deposit')}
                >
                  <DepositIcon width={16} height={16} />
                  <Text style={styles.depositButtonText}>Deposit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.withdrawButton}
                  onPress={() => router.push('/withdraw')}
                >
                  <WithdrawIcon width={16} height={16} />
                  <Text style={styles.withdrawButtonText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Lending Summary */}
        {isLoading ? (
          <SkeletonLendingSummary />
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MarketIcon width={20} height={20} />
              <Text style={styles.cardTitle}>Lending Summary</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Net APY</Text>
              <Text style={styles.overviewValuePositive}>
                {parseFloat(netAPY) >= 0 ? '+' : ''}{parseFloat(netAPY).toFixed(2)}%
              </Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Health Factor</Text>
              <Text style={[
                styles.overviewInfinity,
                parseFloat(healthFactor) < 1.5 && parseFloat(healthFactor) > 0 ? styles.overviewValueNegative : {}
              ]}>
                {healthFactor === '∞' ? '∞' : parseFloat(healthFactor).toFixed(2)}
              </Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Total Supplied</Text>
              <Text style={styles.overviewValue}>
                ${parseFloat(totalSupplied).toFixed(2)}
              </Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Total Borrowed</Text>
              <Text style={styles.overviewValue}>
                ${parseFloat(totalBorrowed).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Trending Markets */}
        {topMarkets.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MarketIcon width={20} height={20} />
              <Text style={styles.cardTitle}>Trending Markets</Text>
            </View>
            {topMarkets.map((market, index) => (
              <View key={market.symbol} style={[styles.overviewRow, index === topMarkets.length - 1 && { marginBottom: 0 }]}>
                <Text style={styles.overviewLabel}>{market.symbol}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.overviewValue}>
                    ${parseFloat(market.latestPrice || '0').toFixed(4)}
                  </Text>
                  <Text style={styles.overviewLabelSmall}>
                    Vol: ${(parseFloat(market.volumeInQuote || '0') / 1000).toFixed(1)}k
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Start Your Portfolio */}
        <View style={styles.card}>
          <View style={styles.cardCenter}>
            <View style={styles.iconContainer}>
              <PortfolioIcon width={48} height={48} />
            </View>
            <Text style={styles.cardTitleLarge}>Start Your Portfolio</Text>
            <Text style={styles.cardDescription}>
              Build your crypto wealth securely. Deposit assets to track performance.
            </Text>
            <TouchableOpacity style={styles.cardButton}>
              <Text style={styles.cardButtonText}>Add Assets</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ready to Earn */}
        <View style={styles.card}>
          <View style={styles.cardCenter}>
            <View style={styles.iconContainer}>
              <EarnIcon width={48} height={48} />
            </View>
            <Text style={styles.cardTitleLarge}>Ready to Earn?</Text>
            <Text style={styles.cardDescription}>
              Supply assets to lending pools and start earning passive APY today.
            </Text>
            <TouchableOpacity style={styles.cardButton}>
              <Text style={styles.cardButtonText}>Start Earning</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Unlock Liquidity */}
        <View style={styles.card}>
          <View style={styles.cardCenter}>
            <View style={styles.iconContainer}>
              <LiquidityIcon width={48} height={48} />
            </View>
            <Text style={styles.cardTitleLarge}>Unlock Liquidity</Text>
            <Text style={styles.cardDescription}>
              Get instant liquidity against your collateral without selling your assets.
            </Text>
            <TouchableOpacity style={styles.cardButton}>
              <Text style={styles.cardButtonText}>Borrow Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  connectButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  connectButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.5,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
  },
  balanceBackground: {
    padding: 24,
    position: 'relative',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#888888',
  },
  refreshIcon: {
    fontSize: 18,
    color: '#888888',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  balanceUSD: {
    fontSize: 18,
    color: '#888888',
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  depositButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E26B1D',
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  depositButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  withdrawButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  withdrawButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#888888',
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  overviewValuePositive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ECC71',
  },
  overviewInfinity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ECC71',
  },
  overviewValueNegative: {
    color: '#E74C3C',
  },
  overviewLabelSmall: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  cardCenter: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  cardTitleLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  cardButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
