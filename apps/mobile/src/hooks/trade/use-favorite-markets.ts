import * as React from 'react';

interface UseFavoriteMarketsReturn {
  favorites: string[];
  addFavorite: (symbol: string) => void;
  removeFavorite: (symbol: string) => void;
  isFavorite: (symbol: string) => boolean;
}

export function useFavoriteMarkets(): UseFavoriteMarketsReturn {
  const [favorites, setFavorites] = React.useState<string[]>([]);

  const addFavorite = React.useCallback((symbol: string) => {
    setFavorites((prev) => {
      if (prev.includes(symbol)) {
        return prev;
      }
      return [...prev, symbol];
    });
  }, []);

  const removeFavorite = React.useCallback((symbol: string) => {
    setFavorites((prev) => prev.filter((s) => s !== symbol));
  }, []);

  const isFavorite = React.useCallback(
    (symbol: string) => {
      return favorites.includes(symbol);
    },
    [favorites]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}
