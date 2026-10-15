import React from 'react';

export default function StatCard({
  title,
  value,
  subvalue,
  icon: Icon,
  badgeText,
  badgeColor = 'bg-[#2A9D8F]/10 text-[#1D7A6F]',
  iconBg = 'bg-[#E8F5F3]',
  iconColor = 'text-[#2A9D8F]',
  isLoading = false,
}) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow duration-200 border border-[#2A9D8F]/15 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#636E72]">
            {title}
          </span>
          {isLoading ? (
            <div className="mt-2 space-y-1.5 animate-pulse">
              <div className="h-8 bg-gray-200/90 rounded-lg w-3/4"></div>
            </div>
          ) : (
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2D3436] mt-1.5 tracking-tight">
              {value}
            </h3>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {(subvalue || badgeText || isLoading) && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          {isLoading ? (
            <div className="h-3.5 bg-gray-100 rounded w-1/2 animate-pulse"></div>
          ) : (
            subvalue && <span className="text-[#636E72]">{subvalue}</span>
          )}
          {!isLoading && badgeText && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
