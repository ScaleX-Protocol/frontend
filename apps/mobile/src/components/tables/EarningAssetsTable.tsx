import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TokenIcon from "../shared/TokenIcon";
import type { LendingSupply } from '@scalex/types';

interface EarningAssetsTableProps {
  data: LendingSupply[];
}

export function EarningAssetsTable({ data }: EarningAssetsTableProps) {
  return (
    <View>
      {/* Table Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 1 }]}>ASSET</Text>
        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>BALANCE</Text>
        <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>APY</Text>
      </View>

      {/* Table Rows */}
      {data.map((asset, index) => (
        <View key={asset.id || index} style={styles.row}>
          {/* Asset Column */}
          <View style={[styles.cell, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
            <TokenIcon symbol={asset.asset} size="sm" />
            <Text style={styles.assetText}>{asset.asset}</Text>
          </View>

          {/* Balance Column */}
          <View style={[styles.cell, { flex: 1, alignItems: 'center' }]}>
            <Text style={styles.valueText}>
              {parseFloat(asset.suppliedAmount).toFixed(4)} {asset.asset}
            </Text>
          </View>

          {/* APY Column */}
          <View style={[styles.cell, { flex: 1, alignItems: 'flex-end' }]}>
            <Text style={styles.apyText}>
              {asset.apy}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    backgroundColor: '#11111180',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  headerText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cell: {
    flex: 1,
  },
  assetText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#E0E0E0',
  },
  valueText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#E0E0E0',
  },
  apyText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#E0E0E0',
  },
});
