/**
 * Example usage of MMKV Storage
 *
 * This file demonstrates how to use the MMKV storage system
 * Copy the relevant code into your components
 */

import { useMMKVStorage } from './use-mmkv-storage';
import { STORAGE_KEYS } from '../constants/storage-keys';

// ============================================================================
// Example 1: Simple String Storage
// ============================================================================
export function useTheme() {
  const [theme, setTheme] = useMMKVStorage<string>(
    STORAGE_KEYS.THEME,
    'dark' // default value
  );

  return { theme, setTheme };
}

// ============================================================================
// Example 2: Array Storage (Favorite Markets)
// ============================================================================
export function useFavoriteMarkets() {
  const [favorites, setFavorites] = useMMKVStorage<string[]>(
    STORAGE_KEYS.FAVORITE_MARKETS,
    [] // default empty array
  );

  const addFavorite = (marketId: string) => {
    setFavorites((prev) => [...prev, marketId]);
  };

  const removeFavorite = (marketId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== marketId));
  };

  const toggleFavorite = (marketId: string) => {
    setFavorites((prev) =>
      prev.includes(marketId)
        ? prev.filter((id) => id !== marketId)
        : [...prev, marketId]
    );
  };

  return { favorites, addFavorite, removeFavorite, toggleFavorite };
}

// ============================================================================
// Example 3: Object Storage (User Preferences)
// ============================================================================
interface UserPreferences {
  currency: string;
  language: string;
  notificationsEnabled: boolean;
  defaultOrderType: 'market' | 'limit' | 'stop-limit';
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useMMKVStorage<UserPreferences>(
    'user_preferences',
    {
      currency: 'USD',
      language: 'en',
      notificationsEnabled: true,
      defaultOrderType: 'market',
    }
  );

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return { preferences, updatePreference, setPreferences };
}

// ============================================================================
// Example 4: Trading State
// ============================================================================
export function useTradingState() {
  const [selectedMarket, setSelectedMarket] = useMMKVStorage<string>(
    STORAGE_KEYS.SELECTED_MARKET,
    'BTC-USD' // default market
  );

  const [chartTimeframe, setChartTimeframe] = useMMKVStorage<string>(
    STORAGE_KEYS.CHART_TIMEFRAME,
    '1h' // default timeframe
  );

  const [orderType, setOrderType] = useMMKVStorage<string>(
    STORAGE_KEYS.DEFAULT_ORDER_TYPE,
    'market' // default order type
  );

  return {
    selectedMarket,
    setSelectedMarket,
    chartTimeframe,
    setChartTimeframe,
    orderType,
    setOrderType,
  };
}

// ============================================================================
// Example 5: Component Usage
// ============================================================================
/*
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTradingState } from './use-mmkv-storage.example';

export function TradingScreen() {
  const { selectedMarket, setSelectedMarket, chartTimeframe, setChartTimeframe } =
    useTradingState();

  return (
    <View>
      <Text>Current Market: {selectedMarket}</Text>
      <Text>Timeframe: {chartTimeframe}</Text>

      <TouchableOpacity onPress={() => setSelectedMarket('ETH-USD')}>
        <Text>Switch to ETH-USD</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setChartTimeframe('5m')}>
        <Text>5m Timeframe</Text>
      </TouchableOpacity>
    </View>
  );
}
*/
