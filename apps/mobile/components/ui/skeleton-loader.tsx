import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonText({ lines = 3, lastLineWidth = '60%' }: { lines?: number; lastLineWidth?: string }) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={14}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
        />
      ))}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton height={16} width="40%" style={{ marginBottom: 16 }} />
      <Skeleton height={48} width="70%" style={{ marginBottom: 24 }} />
      <View style={{ gap: 12 }}>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </View>
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton height={14} width="30%" />
      <Skeleton height={14} width="25%" />
    </View>
  );
}

export function SkeletonBalanceCard() {
  return (
    <View style={styles.balanceCard}>
      <Skeleton height={14} width="50%" style={{ marginBottom: 12 }} />
      <Skeleton height={64} width="60%" style={{ marginBottom: 24 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Skeleton height={48} style={{ flex: 1 }} borderRadius={16} />
        <Skeleton height={48} style={{ flex: 1 }} borderRadius={16} />
      </View>
    </View>
  );
}

export function SkeletonLendingSummary() {
  return (
    <View style={styles.card}>
      {/* Header with border */}
      <View style={[styles.headerWithBorder]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Skeleton height={24} width={24} borderRadius={6} />
          <Skeleton height={16} width="40%" />
        </View>
      </View>
      
      {/* Rows with borders */}
      <View style={styles.rowWithBorder}>
        <Skeleton height={14} width="30%" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Skeleton height={14} width={14} />
          <Skeleton height={14} width={60} />
        </View>
      </View>
      
      <View style={styles.rowWithBorder}>
        <Skeleton height={14} width="35%" />
        <Skeleton height={14} width={40} />
      </View>
      
      <View style={styles.rowWithBorder}>
        <Skeleton height={14} width="40%" />
        <Skeleton height={14} width={60} />
      </View>
      
      <View style={styles.rowLast}>
        <Skeleton height={14} width="40%" />
        <Skeleton height={14} width={60} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton height={40} width={40} borderRadius={20} />
            <View style={{ flex: 1 }}>
              <Skeleton height={16} width="60%" style={{ marginBottom: 6 }} />
              <Skeleton height={12} width="40%" />
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Skeleton height={16} width={80} style={{ marginBottom: 6 }} />
            <Skeleton height={12} width={60} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SkeletonChart() {
  return (
    <View style={{ padding: 20 }}>
      <Skeleton height={200} width="100%" borderRadius={12} />
    </View>
  );
}

export function SkeletonPriceCard() {
  return (
    <View style={{ padding: 20 }}>
      <Skeleton height={20} width="40%" style={{ marginBottom: 8 }} />
      <Skeleton height={48} width="60%" style={{ marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Skeleton height={14} width="50%" style={{ marginBottom: 6 }} />
          <Skeleton height={16} width="70%" />
        </View>
        <View style={{ flex: 1 }}>
          <Skeleton height={14} width="50%" style={{ marginBottom: 6 }} />
          <Skeleton height={16} width="70%" />
        </View>
      </View>
    </View>
  );
}

export function SkeletonOrderBook() {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: 8 }).map((_, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <Skeleton height={14} width="30%" />
          <Skeleton height={14} width="30%" />
          <Skeleton height={14} width="30%" />
        </View>
      ))}
    </View>
  );
}

export function SkeletonTrades() {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Skeleton height={14} width="25%" />
          <Skeleton height={14} width="25%" />
          <Skeleton height={14} width="20%" />
        </View>
      ))}
    </View>
  );
}

export function SkeletonAssetsTable() {
  return (
    <View style={styles.assetsTableCard}>
      {/* Table Header */}
      <View style={styles.tableHeaderRow}>
        <View style={{ flex: 1 }}>
          <Skeleton height={11} width="40%" />
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Skeleton height={11} width="50%" />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Skeleton height={11} width="30%" />
        </View>
      </View>

      {/* Table Rows */}
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.tableRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Skeleton height={24} width={24} borderRadius={12} />
            <Skeleton height={12} width="50%" />
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Skeleton height={12} width="60%" />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Skeleton height={12} width="40%" />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#2A2A2A',
  },
  card: {
    backgroundColor: '#0C0C0C',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  headerWithBorder: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  balanceCard: {
    backgroundColor: '#111111',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222222',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rowWithBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  rowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  assetsTableCard: {
    backgroundColor: "#0C0C0C",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1F1F1F",
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
  },
  tableHeaderRow: {
    backgroundColor: '#11111180',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
});
