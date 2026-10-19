'use client';

import React from 'react';
import { ExternalLink, RefreshCw, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="mt-auto border-t border-[#DCE5E0] bg-[#FFFFFF] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          <div>
            <p className="font-bold text-sm text-[#1D7A6F]">
              MMD — Majlis Musyawaroh Darussalam
            </p>
            <p className="text-xs text-[#5C6B64] mt-0.5">
              Madrasah Islamiyah Darussalamah • Pondok Pesantren Darussalam Sumbersari Kediri
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#5C6B64]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xs bg-[#E8F5F3] text-[#1D7A6F] font-semibold border border-[#C8E3DC]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D7A6F] animate-pulse"></span>
              HOME • WAKA I • WAKA II • WAKA III
            </span>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-[#DCE5E0] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#5C6B64]">
          <p>© {currentYear} MMD Darussalamah. Seluruh hak cipta dilindungi.</p>
          <p className="flex items-center gap-1">
            Data terhubung langsung dengan Google Sheets &amp; Google Docs
          </p>
        </div>
      </div>
    </footer>
  );
}
