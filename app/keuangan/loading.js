import React from 'react';

export default function KeuanganLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-20 h-3.5 bg-stone-200/80 rounded" />
            <div className="w-2.5 h-3.5 bg-stone-200/80 rounded" />
            <div className="w-24 h-3.5 bg-stone-200/80 rounded" />
          </div>
          <div className="w-72 sm:w-96 h-8 bg-stone-200/90 rounded mb-2" />
          <div className="w-80 sm:w-[500px] h-4 bg-stone-200/70 rounded" />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="w-28 h-9 bg-stone-200/70 rounded-lg" />
          <div className="w-24 h-9 bg-stone-200/70 rounded-lg" />
          <div className="w-28 h-9 bg-stone-200/70 rounded-lg" />
        </div>
      </div>

      {/* 3 Large Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-6 border border-[#DCE5E0] bg-white shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1 mr-3">
                <div className="w-28 h-3.5 bg-stone-200/80 rounded" />
                <div className="w-36 h-8 bg-stone-200/90 rounded" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#F7F5EF] border border-[#DCE5E0] shrink-0" />
            </div>
            <div className="mt-4 pt-3 border-t border-[#DCE5E0] flex items-center justify-between">
              <div className="w-32 h-3 bg-stone-100 rounded" />
              <div className="w-16 h-3 bg-stone-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-[#DCE5E0] overflow-hidden shadow-xs">
        <div className="bg-[#F7F5EF] p-4 border-b border-[#DCE5E0] flex items-center justify-between">
          <div className="w-48 h-4 bg-stone-200/90 rounded" />
          <div className="w-24 h-4 bg-stone-200/80 rounded" />
        </div>

        <div className="divide-y divide-[#DCE5E0]/60 p-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4">
              <div className="w-40 h-4 bg-stone-200/90 rounded" />
              <div className="w-28 h-4 bg-stone-200/80 rounded" />
              <div className="w-28 h-4 bg-stone-200/80 rounded" />
              <div className="w-28 h-4 bg-stone-200/80 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
