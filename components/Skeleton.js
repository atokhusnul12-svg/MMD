import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-stone-200/80 rounded ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#DCE5E0] flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-3 space-y-2.5">
          <div className="h-3.5 bg-stone-200/70 rounded w-1/3 animate-pulse"></div>
          <div className="h-8 bg-stone-200/90 rounded w-3/4 animate-pulse"></div>
        </div>
        <div className="w-11 h-11 rounded-lg bg-[#F7F5EF] border border-[#DCE5E0] animate-pulse shrink-0"></div>
      </div>
      <div className="mt-4 pt-3 border-t border-[#DCE5E0] flex items-center justify-between">
        <div className="h-3.5 bg-stone-100 rounded w-1/2 animate-pulse"></div>
        <div className="h-4 bg-stone-100 rounded w-16 animate-pulse"></div>
      </div>
    </div>
  );
}

export function AgendaSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white border border-[#DCE5E0] flex flex-col justify-between animate-pulse">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-stone-200 rounded w-16"></div>
          <div className="h-3 bg-stone-200 rounded w-12"></div>
        </div>
        <div className="h-4 bg-stone-200 rounded w-5/6 mb-2"></div>
        <div className="h-3 bg-stone-100 rounded w-2/3"></div>
      </div>
      <div className="mt-4 pt-2.5 border-t border-[#DCE5E0] flex items-center justify-between">
        <div className="h-3 bg-stone-100 rounded w-14"></div>
        <div className="h-4 bg-stone-200 rounded w-16"></div>
      </div>
    </div>
  );
}

