'use client';

import React from 'react';
import { ExternalLink, RefreshCw, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="mt-auto border-t border-[#2A9D8F]/20 bg-white/70 backdrop-blur-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          <div>
            <p className="font-semibold text-sm text-[#2D3436]">
              WAKA III — MMD Madrasah Islamiyah Darussalamah
            </p>
            <p className="text-xs text-[#636E72] mt-0.5">
              Pondok Pesantren Darussalam Sumbersari | Tahun Ajaran 1447-1448 H / 2026-2027 M
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#636E72]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F3] text-[#1D7A6F] font-medium border border-[#2A9D8F]/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Google Sheets
            </span>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#636E72]">
          <p>© {currentYear} WAKA III Darussalamah. Seluruh hak cipta dilindungi.</p>
          <p className="flex items-center gap-1">
            Data terhubung langsung dengan Google Sheets (CSV)
          </p>
        </div>
      </div>
    </footer>
  );
}
