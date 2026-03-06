"use client";

import { DataTable } from "@/features/trade/components/history/dataTable";
import { activityColumns } from "./activityColumns";
import { Loader2 } from "lucide-react";
import type { ActivityItem } from "../../types/activity.types";

interface ActivityFeedDesktopProps {
  data: ActivityItem[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export default function ActivityFeedDesktop({
  data,
  isLoading,
  error,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: ActivityFeedDesktopProps) {
  return (
    <div>
      <DataTable
        columns={activityColumns}
        data={data}
        isLoading={isLoading}
        error={error}
        emptyMessage="No activity found"
        loadingMessage="Loading activity..."
        errorMessage="Error loading activity"
        getRowId={(row) => row.id}
      />

      {/* Load More */}
      {hasMore && !isLoading && (
        <div className="flex justify-center py-4 border-t border-[#1F1F1F]">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#A0A0A0] hover:text-white bg-[#161616] hover:bg-[#222222] rounded-full border border-[#222222] transition-all disabled:opacity-50"
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
        </div>
      )}
    </div>
  );
}
