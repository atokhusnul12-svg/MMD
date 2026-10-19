import React from 'react';

export default function KalenderLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-20 h-3.5 bg-stone-200/80 rounded" />
            <div className="w-2.5 h-3.5 bg-stone-200/80 rounded" />
            <div className="w-28 h-3.5 bg-stone-200/80 rounded" />
          </div>
          <div className="w-72 sm:w-96 h-8 bg-stone-200/90 rounded mb-2" />
          <div className="w-80 sm:w-[500px] h-4 bg-stone-200/70 rounded" />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="w-24 h-9 bg-stone-200/70 rounded-lg" />
          <div className="w-28 h-9 bg-stone-200/70 rounded-lg" />
        </div>
      </div>

      {/* 2 Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl p-5 border border-[#DCE5E0] bg-white shadow-xs flex items-center justify-between"
          >
            <div className="space-y-2 flex-1 mr-3">
              <div className="w-32 h-3 bg-stone-200/80 rounded" />
              <div className="w-20 h-7 bg-stone-200/90 rounded" />
              <div className="w-36 h-3 bg-stone-100 rounded" />
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#F7F5EF] border border-[#DCE5E0] shrink-0" />
          </div>
        ))}
      </div>

      {/* Tabs / Filter Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-28 h-9 bg-stone-200/70 rounded-lg shrink-0" />
        ))}
      </div>

      {/* Calendar List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white border border-[#DCE5E0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 rounded-lg bg-stone-100 border border-[#DCE5E0] shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-3/4 sm:w-1/2 h-4 bg-stone-200/90 rounded" />
                <div className="w-1/2 sm:w-1/3 h-3 bg-stone-100 rounded" />
              </div>
            </div>
            <div className="w-24 h-6 bg-stone-200/80 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
