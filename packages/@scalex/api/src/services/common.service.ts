import { CurrenciesResponse } from "@scalex/types";
import { APIClient } from "../client/api-client";

export const CommonService = {
  getCurrencies: (client: APIClient) =>
    client.fetch<CurrenciesResponse>("/currencies"),

  getTickerPrice: (client: APIClient, symbol: string) =>
    client.fetch<{ symbol: string; price: string }>(
      `/ticker/price?symbol=${symbol}`,
    ),
};
