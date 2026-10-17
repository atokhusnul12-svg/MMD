import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDown } from 'lucide-react';

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
  href,
  onClick,
  ariaLabel,
  titleTooltip,
  actionHint,
}) {
  const isInteractive = Boolean(href || onClick);
  const isExternalLink = Boolean(href);

  const containerClasses = `
    bg-white rounded-xl p-4 sm:p-5 lg:p-6 border border-[#DCE5E0] shadow-xs
    flex flex-col justify-between text-left
    ${
      isInteractive
        ? 'cursor-pointer group hover:border-[#1D7A6F] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F] focus-visible:ring-offset-2 select-none'
        : 'hover:border-[#1D7A6F]/40 transition-colors duration-150'
    }
  `;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E66] block truncate group-hover:text-[#1D7A6F] transition-colors">
              {title}
            </span>
            {isInteractive && (
              <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity text-[#1D7A6F]">
                {isExternalLink ? (
                  <ArrowUpRight className="w-3.5 h-3.5 inline-block group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 inline-block group-hover:translate-y-0.5 transition-transform" />
                )}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="mt-2 space-y-1.5 animate-pulse">
              <div className="h-8 bg-stone-200/80 rounded w-3/4"></div>
            </div>
          ) : (
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#26332E] mt-1.5 tracking-tight font-serif break-words">
              {value}
            </h3>
          )}
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0 border border-[#DCE5E0] ${
              isInteractive ? 'group-hover:scale-105 group-hover:border-[#1D7A6F]/40 transition-all duration-200' : ''
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subvalue || badgeText || actionHint || isLoading) && (
        <div className="mt-4 pt-3 border-t border-[#DCE5E0] flex items-center justify-between text-xs gap-2">
          {isLoading ? (
            <div className="h-3.5 bg-stone-100 rounded w-1/2 animate-pulse"></div>
          ) : (
            subvalue && <span className="text-[#5C6E66] truncate">{subvalue}</span>
          )}

          {!isLoading && (
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {actionHint && (
                <span className="text-[10px] font-semibold text-[#1D7A6F] hidden sm:inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                  {actionHint}
                </span>
              )}
              {badgeText && (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeColor} transition-colors`}
                >
                  {badgeText}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  const calculatedAriaLabel =
    ariaLabel ||
    (isExternalLink
      ? `Buka halaman ${title}`
      : onClick
      ? `Gulir ke bagian ${title}`
      : undefined);

  if (href) {
    return (
      <Link
        href={href}
        className={containerClasses}
        aria-label={calculatedAriaLabel}
        title={titleTooltip || `Klik untuk membuka ${title}`}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(e);
          }
        }}
        className={containerClasses}
        aria-label={calculatedAriaLabel}
        title={titleTooltip || `Klik untuk melihat detail ${title}`}
      >
        {content}
      </div>
    );
  }

  return <div className={containerClasses}>{content}</div>;
}
