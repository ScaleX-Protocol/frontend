"use client";

import { Loader2, Inbox, AlertCircle } from "lucide-react";
import ActivityItemCard from "./ActivityItemCard";
import type { ActivityItem } from "../../types/activity.types";

interface ActivityFeedMobileProps {
  data: ActivityItem[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export default function ActivityFeedMobile({
  data,
  isLoading,
  error,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: ActivityFeedMobileProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 text-[#F06718] animate-spin" />
        <span className="text-[#555555] text-xs">Loading activity...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-400" />
        </div>
        <span className="text-red-400 text-xs font-medium">Error loading activity</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1F1F1F] flex items-center justify-center">
          <Inbox className="w-5 h-5 text-[#555555]" />
        </div>
        <span className="text-[#555555] text-xs">No activity found</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => (
        <ActivityItemCard key={item.id} item={item} />
      ))}

      {/* Load More */}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="flex items-center justify-center gap-2 py-3 text-xs font-medium text-[#A0A0A0] hover:text-white transition-colors disabled:opacity-50"
        >
          {isLoadingMore ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Loading...
            </>
          ) : (
            "Load More"
          )}
        </button>
      )}
    </div>
  );
}
