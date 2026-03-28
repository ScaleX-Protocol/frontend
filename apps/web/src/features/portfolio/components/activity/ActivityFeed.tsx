"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useWalletState } from "@/hooks/useWalletState";
import { ChainConfig } from "@/configs/chain";
import { useViewMode } from "@/hooks/ui/useViewMode";
import { usePortfolioActivity } from "../../hooks/usePortfolioActivity";
import ActivityFilters from "./ActivityFilters";
import ActivityFeedDesktop from "./ActivityFeedDesktop";
import ActivityFeedMobile from "./ActivityFeedMobile";
import type { ActivityFilter, TimePeriodFilter, ActivityItem } from "../../types/activity.types";

const PAGE_SIZE = 20;

export default function ActivityFeed() {
  const viewMode = useViewMode();
  const wallet = useWalletState();

  const activeWalletAddress =
    wallet.embeddedWallet.address !== "Not Created"
      ? wallet.embeddedWallet.address
      : wallet.externalWallet.address;

  const isWalletConnected =
    activeWalletAddress !== "Not Created" &&
    activeWalletAddress !== "Not Connected";

  const [activityType, setActivityType] = useState<ActivityFilter>("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriodFilter>("all");
  const [offset, setOffset] = useState(0);
  const [accumulatedData, setAccumulatedData] = useState<ActivityItem[]>([]);
  const prevDataRef = useRef<string>("");

  const { data, isLoading, error, isFetching } = usePortfolioActivity(
    {
      address: activeWalletAddress,
      type: activityType,
      period: timePeriod,
      limit: PAGE_SIZE,
      offset,
      chainId: ChainConfig.defaultChainId,
    },
    {
      enabled: isWalletConnected,
    },
  );

  // Accumulate data when new results arrive
  useEffect(() => {
    if (!data?.data) return;
    const dataKey = JSON.stringify(data.data.map((d) => d.id));
    if (dataKey === prevDataRef.current) return;
    prevDataRef.current = dataKey;

    if (offset === 0) {
      setAccumulatedData(data.data);
    } else {
      setAccumulatedData((prev) => [...prev, ...data.data]);
    }
  }, [data, offset]);

  const handleTypeChange = useCallback((type: ActivityFilter) => {
    setActivityType(type);
    setOffset(0);
    setAccumulatedData([]);
    prevDataRef.current = "";
  }, []);

  const handlePeriodChange = useCallback((period: TimePeriodFilter) => {
    setTimePeriod(period);
    setOffset(0);
    setAccumulatedData([]);
    prevDataRef.current = "";
  }, []);

  const handleLoadMore = useCallback(() => {
    setOffset((prev) => prev + PAGE_SIZE);
  }, []);

  const displayData = accumulatedData.length > 0 ? accumulatedData : data?.data ?? [];
  const hasMore = data?.pagination?.hasMore ?? false;
  const isLoadingMore = offset > 0 && isFetching;

  if (!isWalletConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <span className="text-[#555555] text-sm">
          Connect your wallet to see activity
        </span>
      </div>
    );
  }

  const FeedComponent = viewMode === "mobile" ? ActivityFeedMobile : ActivityFeedDesktop;

  return (
    <div className="flex flex-col gap-4">
      <ActivityFilters
        activeType={activityType}
        activePeriod={timePeriod}
        onTypeChange={handleTypeChange}
        onPeriodChange={handlePeriodChange}
      />

      <FeedComponent
        data={displayData}
        isLoading={isLoading && offset === 0}
        error={error}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
