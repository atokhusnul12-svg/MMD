import React from 'react';

export default function BahsuLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-20 h-3.5 bg-stone-200/80 rounded" />
            <div className="w-2.5 h-3.5 bg-stone-200/80 rounded" />
            <div className="w-32 h-3.5 bg-stone-200/80 rounded" />
          </div>
          <div className="w-72 sm:w-96 h-8 bg-stone-200/90 rounded mb-2" />
          <div className="w-64 sm:w-[500px] h-4 bg-stone-200/70 rounded" />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="w-32 h-9 bg-stone-200/90 rounded-lg" />
          <div className="w-28 h-9 bg-stone-200/70 rounded-lg" />
          <div className="w-24 h-9 bg-stone-200/70 rounded-lg" />
          <div className="w-28 h-9 bg-stone-200/70 rounded-lg" />
        </div>
      </div>

      {/* 4 Summary Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl p-5 border border-[#DCE5E0] bg-white shadow-xs flex items-center justify-between"
          >
            <div className="space-y-2 flex-1 mr-3">
              <div className="w-24 h-3 bg-stone-200/80 rounded" />
              <div className="w-20 h-7 bg-stone-200/90 rounded" />
              <div className="w-32 h-3 bg-stone-100 rounded" />
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#F7F5EF] border border-[#DCE5E0] shrink-0" />
          </div>
        ))}
      </div>

      {/* Filter & Search Bar Skeleton */}
      <div className="bg-white rounded-xl p-4 border border-[#DCE5E0] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80 h-10 bg-stone-100 rounded-lg border border-[#DCE5E0]" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-24 h-9 bg-stone-100 rounded-lg" />
          <div className="w-28 h-9 bg-stone-100 rounded-lg" />
          <div className="w-24 h-9 bg-stone-100 rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl border border-[#DCE5E0] overflow-hidden shadow-xs">
        {/* Table Header Skeleton */}
        <div className="bg-[#F7F5EF] p-4 border-b border-[#DCE5E0] flex items-center justify-between">
          <div className="w-48 h-4 bg-stone-200/90 rounded" />
          <div className="w-24 h-4 bg-stone-200/80 rounded" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-[#DCE5E0]/60 p-2">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-stone-200/70 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="w-3/4 sm:w-1/2 h-4 bg-stone-200/90 rounded" />
                  <div className="w-1/2 sm:w-1/3 h-3 bg-stone-100 rounded" />
                </div>
              </div>
              <div className="hidden sm:block w-28 h-3.5 bg-stone-200/70 rounded" />
              <div className="w-24 h-6 bg-stone-200/80 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
