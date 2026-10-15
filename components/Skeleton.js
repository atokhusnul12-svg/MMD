import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 dark:bg-gray-700/50 rounded-lg ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#2A9D8F]/15 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-3 space-y-2.5">
          <div className="h-3.5 bg-gray-200/70 rounded w-1/3 animate-pulse"></div>
          <div className="h-8 bg-gray-200/90 rounded-lg w-3/4 animate-pulse"></div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#E8F5F3] animate-pulse shrink-0"></div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="h-3.5 bg-gray-100 rounded w-1/2 animate-pulse"></div>
        <div className="h-4 bg-gray-100 rounded-full w-16 animate-pulse"></div>
      </div>
    </div>
  );
}

export function AgendaSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#2A9D8F]/15 flex flex-col justify-between animate-pulse">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded-full w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
      </div>
      <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between">
        <div className="h-3 bg-gray-100 rounded w-14"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );
}
