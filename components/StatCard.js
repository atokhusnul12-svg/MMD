'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ArrowDown } from 'lucide-react';

/**
 * StatCard — Komponen Kartu Statistik Teranimasi WAKA III
 * Terinspirasi dari estetika resmi Pondok Pesantren Darussalam Sumbersari:
 * - Animasi muncul bertingkat (stagger entrance + scroll reveal).
 * - Efek hover terangkat halus (lift elevation) dengan bayangan lembut.
 * - Mikro-interaksi pada ikon dan indikator panah.
 * - Otomatis nonaktif saat prefers-reduced-motion aktif atau saat dicetak.
 */
export default function StatCard({
  index = 0,
  title,
  value,
  subvalue,
  icon: Icon,
  badgeText,
  badgeColor = 'bg-[#F0F4FA] text-[#0A192F] border-[#D0DDEB]',
  iconBg = 'bg-[#F0F4FA]',
  iconColor = 'text-[#0A192F]',
  isLoading = false,
  href,
  onClick,
  ariaLabel,
  titleTooltip,
  actionHint,
}) {
  const isInteractive = Boolean(href || onClick);
  const isExternalLink = Boolean(href);
  const shouldReduceMotion = useReducedMotion();

  const containerClasses = `
    w-full h-full bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#E2E8F0] shadow-xs
    flex flex-col justify-between text-left transition-all duration-300
    ${
      isInteractive
        ? 'cursor-pointer group hover:border-[#0A192F]/40 hover:shadow-md focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A192F] focus-visible:ring-offset-2 select-none'
        : 'hover:border-[#0A192F]/20'
    }
  `;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] block truncate group-hover:text-[#0A192F] transition-colors duration-200">
              {title}
            </span>
            {isInteractive && (
              <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-200 text-[#C5A059]">
                {isExternalLink ? (
                  <ArrowUpRight className="w-3.5 h-3.5 inline-block group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 inline-block group-hover:translate-y-0.5 transition-transform duration-200" />
                )}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="mt-2 space-y-1.5 animate-pulse">
              <div className="h-8 bg-slate-200 rounded-lg w-3/4"></div>
            </div>
          ) : (
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0A192F] mt-1.5 tracking-tight font-serif break-words">
              {value}
            </h3>
          )}
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 border border-[#E2E8F0] shadow-2xs transition-all duration-300 ${
              isInteractive
                ? 'group-hover:scale-108 group-hover:-translate-y-0.5 group-hover:border-[#0A192F]/30 group-hover:shadow-xs'
                : ''
            }`}
          >
            <Icon className="w-5 h-5 transition-transform duration-300" />
          </div>
        )}
      </div>

      {(subvalue || badgeText || actionHint || isLoading) && (
        <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs gap-2">
          {isLoading ? (
            <div className="h-3.5 bg-slate-100 rounded w-1/2 animate-pulse"></div>
          ) : (
            subvalue && <span className="text-[#475569] truncate font-medium">{subvalue}</span>
          )}

          {!isLoading && (
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {actionHint && (
                <span className="text-[10px] font-semibold text-[#0A192F] group-hover:text-[#C5A059] hidden sm:inline-block opacity-0 group-hover:opacity-100 transition-all duration-200">
                  {actionHint}
                </span>
              )}
              {badgeText && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeColor} transition-colors duration-200`}
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

  // Pengaturan animasi entrance dan hover dengan Framer Motion
  const motionProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: {
          duration: 0.45,
          delay: (index || 0) * 0.08,
          ease: [0.25, 0.1, 0.25, 1.0],
        },
        whileHover: isInteractive
          ? { y: -4, transition: { duration: 0.22, ease: 'easeOut' } }
          : undefined,
        whileTap: isInteractive ? { scale: 0.99, y: -1 } : undefined,
      };

  if (href) {
    return (
      <motion.div {...motionProps} className="h-full print-avoid-break">
        <Link
          href={href}
          className={containerClasses}
          aria-label={calculatedAriaLabel}
          title={titleTooltip || `Klik untuk membuka ${title}`}
        >
          {content}
        </Link>
      </motion.div>
    );
  }

  if (onClick) {
    return (
      <motion.div {...motionProps} className="h-full print-avoid-break">
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
      </motion.div>
    );
  }

  return (
    <motion.div {...motionProps} className="h-full print-avoid-break">
      <div className={containerClasses}>{content}</div>
    </motion.div>
  );
}
