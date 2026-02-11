import { isConnected, useEmbeddedWallet } from '@privy-io/expo';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLendingDashboard } from '~/src/hooks/lending/useLendingDashboard';
import CheckmarkIcon from '../../assets/icon/ic_checkmark.svg';
import EarnIcon from '../../assets/icon/ic_earn.svg';
import LightningIcon from '../../assets/icon/ic_lightning.svg';
import SortIcon from '../../assets/icon/ic_sort.svg';
import StatIcon from '../../assets/icon/ic_stat.svg';
import UnlockLiquidityIcon from '../../assets/icon/ic_unlock_liquidity.svg';
import { SkeletonLendingSummary, SkeletonList } from '../../components/ui/skeleton-loader';
import { ChainConfig } from '@scalex/service-wallet';

function LendingScreenContent() {
  const [activeTab, setActiveTab] = React.useState<'borrow' | 'positions'>('borrow');
  const [refreshing, setRefreshing] = React.useState(false);
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);

  const wallet = useEmbeddedWallet();

  // Get wallet address when connected
  React.useEffect(() => {
    if (wallet && isConnected(wallet)) {
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

  // Fetch lending dashboard data
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

  // Show skeleton during initial load OR when refetching (pull-to-refresh)
  const isLoading = isDashboardLoading || isDashboardFetching || refreshing;

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchDashboard();
    } catch (error) {
      console.error('[Lending] Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchDashboard]);

  // Extract lending data with fallbacks
  const netAPY = dashboardData?.summary?.netAPY?.toString() || '0.00';
  const healthFactor = dashboardData?.summary?.healthFactor
    ? (dashboardData.summary.healthFactor === 'Infinity' ? '∞' : dashboardData.summary.healthFactor.toString())
    : '∞';
  const totalSupplied = dashboardData?.summary?.totalSupplied?.toString() || '0.00';
  const totalBorrowed = dashboardData?.summary?.totalBorrowed?.toString() || '0.00';
  const borrowingPower = dashboardData?.summary?.borrowingPower?.toString() || '0.00';

  // Extract positions data
  const availableToBorrow = dashboardData?.availableToBorrow || [];
  const borrowedAssets = dashboardData?.borrows || [];
  const earningAssets = dashboardData?.supplies || [];

  // Calculate borrowing power usage percentage
  const borrowingPowerUsagePercent = React.useMemo(() => {
    const supplied = parseFloat(totalSupplied);
    const borrowed = parseFloat(totalBorrowed);
    if (supplied === 0) return 0;
    return Math.min((borrowed / supplied) * 100, 100);
  }, [totalSupplied, totalBorrowed]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
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
            {/* <Image
              source={require('../../assets/images/ScaleX.webp')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logo}>ScaleX</Text> */}
          </View>
          <View style={styles.networkIndicator}>
            <View style={styles.networkDot} />
            <Text style={styles.networkText}>
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not Connected'}
            </Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>
          {isLoading ? (
            <SkeletonLendingSummary />
          ) : (
            <View style={styles.summaryCard}>
              {/* Net APY */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Net APY</Text>
                <View style={styles.summaryValueWithIcon}>
                  <StatIcon width={16} height={16} />
                  <Text style={styles.summaryValueGreen}>
                    {parseFloat(netAPY) >= 0 ? '+' : ''}{parseFloat(netAPY).toFixed(2)}%
                  </Text>
                </View>
              </View>

              {/* Health Factor */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Health Factor</Text>
                <View style={styles.summaryValueWithIcon}>
                  <CheckmarkIcon width={16} height={16} />
                  <Text style={[
                    styles.summaryValueGreen,
                    parseFloat(healthFactor) < 1.5 && parseFloat(healthFactor) > 0 ? styles.summaryValueRed : {}
                  ]}>
                    {healthFactor === '∞' ? '∞' : parseFloat(healthFactor).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Borrowing Power */}
              <View style={styles.borrowingPowerSection}>
                <Text style={styles.summaryLabel}>Borrowing Power</Text>
                <Text style={styles.borrowingPowerValue}>
                  ${parseFloat(borrowingPower).toFixed(2)}
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${borrowingPowerUsagePercent}%` }]} />
                </View>
              </View>

              {/* Total Supplied and Borrowed */}
              <View style={styles.totalsRow}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Total Supplied</Text>
                  <Text style={styles.totalValue}>
                    ${parseFloat(totalSupplied).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Total Borrowed</Text>
                  <Text style={styles.totalValue}>
                    ${parseFloat(totalBorrowed).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'borrow' && styles.tabActive]}
            onPress={() => {
              setActiveTab('borrow');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'borrow' && styles.tabTextActive]}>
              Assets to Borrow
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'positions' && styles.tabActive]}
            onPress={() => {
              setActiveTab('positions');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'positions' && styles.tabTextActive]}>
              My Positions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'positions' ? (
          <View style={styles.tabContent}>
            {/* Borrowed Assets */}
            <Text style={styles.sectionTitle}>Borrowed Assets</Text>
            {isLoading ? (
              <SkeletonList count={2} />
            ) : borrowedAssets.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconContainer}>
                  <UnlockLiquidityIcon width={28} height={28} />
                </View>
                <Text style={styles.emptyTitle}>Unlock Instant Liquidity</Text>
                <Text style={styles.emptyDescription}>
                  Access capital without selling your crypto.
                </Text>
                <TouchableOpacity style={styles.ctaButton} onPress={() => setActiveTab('borrow')}>
                  <LightningIcon width={16} height={16} />
                  <Text style={styles.ctaButtonText}>Borrow Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.positionList}>
                {borrowedAssets.map((borrow) => {
                  const assetSymbol = borrow.asset.replace('sx', '');
                  const healthColor = borrow.healthStatus === 'safe' ? '#2ECC71' : borrow.healthStatus === 'warning' ? '#F39C12' : '#E74C3C';

                  return (
                    <View key={borrow.id} style={styles.positionCard}>
                      <View style={styles.positionHeader}>
                        <Text style={styles.positionAsset}>{assetSymbol}</Text>
                        <View style={[styles.healthBadge, { backgroundColor: `${healthColor}20` }]}>
                          <Text style={[styles.healthBadgeText, { color: healthColor }]}>
                            {borrow.healthStatus.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.positionRow}>
                        <Text style={styles.positionLabel}>Borrowed</Text>
                        <Text style={styles.positionValue}>${parseFloat(borrow.currentDebt).toFixed(2)}</Text>
                      </View>
                      <View style={styles.positionRow}>
                        <Text style={styles.positionLabel}>APY</Text>
                        <Text style={styles.positionValue}>{parseFloat(borrow.apy).toFixed(2)}%</Text>
                      </View>
                      <View style={styles.positionRow}>
                        <Text style={styles.positionLabel}>Health Factor</Text>
                        <Text style={[styles.positionValue, { color: healthColor }]}>
                          {parseFloat(borrow.healthFactor).toFixed(2)}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.repayButton}>
                        <Text style={styles.repayButtonText}>Repay</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Earning Assets */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Earning Assets</Text>
            {isLoading ? (
              <SkeletonList count={2} />
            ) : earningAssets.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconContainer}>
                  <EarnIcon width={24} height={24} />
                </View>
                <Text style={styles.emptyTitle}>Ready to Earn?</Text>
                <Text style={styles.emptyDescription}>
                  Your idle assets could be growing.
                </Text>
                <TouchableOpacity style={styles.ctaButton}>
                  <LightningIcon width={16} height={16} />
                  <Text style={styles.ctaButtonText}>Start Earning</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.positionList}>
                {earningAssets.map((supply) => {
                  const assetSymbol = supply.asset.replace('sx', '');

                  return (
                    <View key={supply.id} style={styles.positionCard}>
                      <View style={styles.positionHeader}>
                        <Text style={styles.positionAsset}>{assetSymbol}</Text>
                        <View style={[styles.healthBadge, { backgroundColor: '#2ECC7120' }]}>
                          <Text style={[styles.healthBadgeText, { color: '#2ECC71' }]}>EARNING</Text>
                        </View>
                      </View>
                      <View style={styles.positionRow}>
                        <Text style={styles.positionLabel}>Supplied</Text>
                        <Text style={styles.positionValue}>${parseFloat(supply.currentValue).toFixed(2)}</Text>
                      </View>
                      <View style={styles.positionRow}>
                        <Text style={styles.positionLabel}>APY</Text>
                        <Text style={styles.positionValue}>{parseFloat(supply.apy).toFixed(2)}%</Text>
                      </View>
                      <View style={styles.positionRow}>
                        <Text style={styles.positionLabel}>Earnings</Text>
                        <Text style={[styles.positionValue, { color: '#2ECC71' }]}>
                          +${parseFloat(supply.earnings).toFixed(2)}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.withdrawButton}>
                        <Text style={styles.withdrawButtonText}>Withdraw</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* Sort By */}
            <View style={styles.sortContainer}>
              <SortIcon width={16} height={16} />
              <Text style={styles.sortText}>Sort by APY</Text>
            </View>

            {/* Asset List */}
            {isLoading ? (
              <SkeletonList count={5} />
            ) : availableToBorrow.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyTitle}>No Assets Available</Text>
                <Text style={styles.emptyDescription}>
                  There are no assets available to borrow at the moment.
                </Text>
              </View>
            ) : (
              <View style={styles.assetList}>
                {availableToBorrow.map((asset) => {
                  const assetSymbol = asset.asset.replace('sx', '');
                  const getAssetColor = (symbol: string) => {
                    const colors: Record<string, string> = {
                      'USDC': '#2775CA',
                      'USDT': '#26A17B',
                      'DAI': '#F5AC37',
                      'ETH': '#627EEA',
                      'WETH': '#627EEA',
                      'BTC': '#F7931A',
                      'WBTC': '#F7931A',
                    };
                    return colors[symbol] || '#888888';
                  };

                  const formatLiquidity = (value: string) => {
                    const num = parseFloat(value);
                    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
                    return num.toFixed(2);
                  };

                  return (
                    <View key={asset.assetAddress} style={styles.assetCard}>
                      <View style={styles.assetHeader}>
                        <View style={styles.assetLeft}>
                          <View style={[styles.assetIcon, { backgroundColor: getAssetColor(assetSymbol) }]}>
                            <Text style={styles.assetIconText}>{assetSymbol.charAt(0)}</Text>
                          </View>
                          <View>
                            <Text style={styles.assetName}>{assetSymbol}</Text>
                            <Text style={styles.assetSubtitle}>{asset.asset}</Text>
                          </View>
                        </View>
                        <View style={styles.assetRight}>
                          <Text style={styles.assetApy}>{parseFloat(asset.apy).toFixed(2)}%</Text>
                          <Text style={styles.assetApyLabel}>APY</Text>
                        </View>
                      </View>
                      <View style={styles.assetDetails}>
                        <Text style={styles.liquidityLabel}>Liquidity</Text>
                        <Text style={styles.liquidityValue}>{formatLiquidity(asset.availableLiquidity)}</Text>
                      </View>
                      <View style={styles.borrowButtonContainer}>
                        <TouchableOpacity
                          style={[styles.borrowButton, !asset.canBorrow && styles.borrowButtonDisabled]}
                          disabled={!asset.canBorrow}
                        >
                          <Text style={styles.borrowButtonText}>Borrow</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.infoButton}>
                          <Text style={styles.infoButtonText}>ⓘ</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 120,
    height: 32,
  }, logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  networkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
  },
  networkText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#888888',
  },
  summaryValueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryPercentage: {
    fontSize: 14,
  },
  summaryValueGreen: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ECC71',
  },
  summaryValueRed: {
    color: '#E74C3C',
  },
  borrowingPowerSection: {
    marginBottom: 16,
  },
  borrowingPowerValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  totalItem: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    paddingBottom: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyStateCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    width: '100%',
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 16,
    gap: 6,
  },
  sortText: {
    fontSize: 13,
    color: '#888888',
  },
  assetList: {
    gap: 12,
  },
  assetCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  assetSubtitle: {
    fontSize: 12,
    color: '#888888',
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetApy: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  assetApyLabel: {
    fontSize: 11,
    color: '#888888',
  },
  assetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  liquidityLabel: {
    fontSize: 13,
    color: '#888888',
  },
  liquidityValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  borrowButtonContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  borrowButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  borrowButtonDisabled: {
    backgroundColor: '#3A3A3A',
    opacity: 0.5,
  },
  borrowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 18,
    color: '#888888',
  },
  positionList: {
    gap: 12,
  },
  positionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  positionAsset: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionLabel: {
    fontSize: 14,
    color: '#888888',
  },
  positionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  repayButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  repayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  withdrawButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default function LendingScreen() {
  return <LendingScreenContent />;
}
