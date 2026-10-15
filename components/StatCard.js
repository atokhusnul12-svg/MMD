import React from 'react';

export default function StatCard({
  title,
  value,
  subvalue,
  icon: Icon,
  badgeText,
  badgeColor = 'bg-[#E8F5F3] text-[#1D7A6F] border-[#C8E3DC]',
  iconBg = 'bg-[#F7F5EF]',
  iconColor = 'text-[#1D7A6F]',
  isLoading = false,
}) {
  return (
    <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#DCE5E0] shadow-xs hover:border-[#1D7A6F]/40 transition-colors duration-150 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E66]">
            {title}
          </span>
          {isLoading ? (
            <div className="mt-2 space-y-1.5 animate-pulse">
              <div className="h-8 bg-stone-200/80 rounded w-3/4"></div>
            </div>
          ) : (
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#26332E] mt-1.5 tracking-tight font-serif">
              {value}
            </h3>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0 border border-[#DCE5E0]`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subvalue || badgeText || isLoading) && (
        <div className="mt-4 pt-3 border-t border-[#DCE5E0] flex items-center justify-between text-xs">
          {isLoading ? (
            <div className="h-3.5 bg-stone-100 rounded w-1/2 animate-pulse"></div>
          ) : (
            subvalue && <span className="text-[#5C6E66]">{subvalue}</span>
          )}
          {!isLoading && badgeText && (
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeColor}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

