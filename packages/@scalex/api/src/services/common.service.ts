import { CurrenciesResponse } from "@scalex/types";
import { IndexerClient } from "../client/indexer-client";

export const CommonService = {
  getCurrencies: (client: IndexerClient) =>
    client.fetch<CurrenciesResponse>("/common/currencies"),

  getTickerPrice: (client: IndexerClient, symbol: string) =>
    client.fetch<{ symbol: string; price: string }>(
      `/trading/ticker/price?symbol=${symbol}`,
    ),
};
