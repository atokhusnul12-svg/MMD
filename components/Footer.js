'use client';

import React from 'react';
import { Mail } from 'lucide-react';

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.33C9.33 7.33 9.04 7.4 8.8 7.66C8.56 7.92 7.87 8.57 7.87 9.91C7.87 11.24 8.84 12.52 8.98 12.71C9.11 12.9 10.89 15.63 13.62 16.81C14.27 17.09 14.78 17.26 15.17 17.39C15.83 17.59 16.43 17.57 16.9 17.5C17.43 17.42 18.53 16.83 18.76 16.19C18.99 15.54 18.99 14.99 18.92 14.87C18.85 14.76 18.66 14.69 18.37 14.55C18.08 14.41 16.65 13.7 16.38 13.6C16.12 13.51 15.92 13.46 15.73 13.75C15.53 14.04 14.97 14.69 14.8 14.89C14.63 15.08 14.46 15.11 14.17 14.96C13.88 14.82 12.94 14.51 11.83 13.52C10.97 12.75 10.39 11.8 10.22 11.51C10.05 11.22 10.2 11.06 10.35 10.92C10.48 10.79 10.65 10.57 10.79 10.4C10.94 10.23 10.99 10.11 11.09 9.91C11.18 9.72 11.14 9.55 11.06 9.4C10.99 9.26 10.41 7.83 10.17 7.25C9.93 6.69 9.69 6.77 9.53 6.76C9.37 6.75 9.18 6.75 8.98 6.75"/>
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#DCE5E0] bg-[#FFFFFF] py-6 sm:py-8 no-print">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Baris Atas: Identitas Lembaga & Kontak Langsung */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          <div>
            <p className="font-bold text-sm text-[#1D7A6F]">
              MMD — Majlis Musyawaroh Darussalam
            </p>
            <p className="text-xs text-[#5C6B64] mt-0.5">
              Madrasah Islamiyah Darussalamah • Pondok Pesantren Darussalam Sumbersari Kediri
            </p>
          </div>

          {/* Kontak Resmi: WA, E-mail, Instagram */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-4 text-xs">
            <a
              href="https://wa.me/6285934664067"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#26332E] hover:text-[#1D7A6F] transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-mono font-medium">085934664067</span>
            </a>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <a
              href="mailto:musyawarohdarulfalah@gmail.com"
              className="inline-flex items-center gap-1.5 text-[#26332E] hover:text-[#1D7A6F] transition-colors"
            >
              <Mail className="w-4 h-4 text-[#1D7A6F] shrink-0" />
              <span>musyawarohdarulfalah@gmail.com</span>
            </a>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <a
              href="https://instagram.com/turats.sumbersari"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#26332E] hover:text-[#1D7A6F] transition-colors"
            >
              <InstagramIcon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>turats.sumbersari</span>
            </a>
          </div>

        </div>

        {/* Baris Bawah: Copyright */}
        <div className="mt-6 pt-4 border-t border-[#DCE5E0] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#5C6B64]">
          <p>© 2026 MMD Darussalamah.</p>
          <p className="text-[#5C6B64]/80">
            Sistem Informasi &amp; Manajemen Data Terpadu
          </p>
        </div>

      </div>
    </footer>
  );
}
