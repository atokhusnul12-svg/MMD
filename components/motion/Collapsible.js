'use client';

import React, { useState, useId } from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Collapsible — Komponen Akordion Halus dengan Teknik CSS Grid
 * - Menggunakan transisi CSS grid-template-rows: 0fr -> 1fr (sangat halus, tanpa layout shift).
 * - Durasi: 280ms, easing: ease-in-out.
 * - Panah berputar 90 derajat (rotate-90) saat terbuka.
 */
export default function Collapsible({
  title,
  icon: Icon,
  badge,
  defaultOpen = false,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className={`rounded-xl border border-white/15 bg-white/5 overflow-hidden transition-colors ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={`w-full flex items-center justify-between p-3 sm:p-3.5 text-left transition-colors cursor-pointer select-none group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ECD8A5] ${headerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {Icon && (
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0 text-[#ECD8A5]">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="text-xs sm:text-sm font-bold text-[#ECD8A5] tracking-wide truncate">
            {title}
          </span>
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/90 shrink-0">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-[#ECD8A5]/90">
          <span className="text-[11px] font-medium hidden sm:inline opacity-80">
            {isOpen ? 'Tutup' : 'Lihat Detail'}
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-300 ease-in-out text-[#ECD8A5] ${
              isOpen ? 'rotate-90' : 'rotate-0'
            }`}
          />
        </div>
      </button>

      {/* Kontainer Grid untuk Transisi Tinggi Otomatis */}
      <div
        id={contentId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className="grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-in-out"
        style={{
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
        }}
      >
        <div className="overflow-hidden">
          <div className={`px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 text-xs text-white/90 leading-relaxed border-t border-white/10 ${contentClassName}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
