'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ExternalLink, Edit3, Activity } from 'lucide-react';
import DiagnosticModal from './DiagnosticModal';

/**
 * Komponen tombol Admin Google Sheets + Alat Tes Koneksi
 * Hanya muncul ketika Admin sedang Login!
 */
export default function AdminButton({ editUrl, title = "Edit Data di Google Sheets" }) {
  const { isAdmin, isLoaded } = useAuth();
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // Jangan tampilkan jika bukan admin atau auth belum dimuat
  if (!isLoaded || !isAdmin) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Tombol Alat Diagnostik / Tes Koneksi */}
        <button
          type="button"
          onClick={() => setShowDiagnostic(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs sm:text-sm font-semibold bg-white text-[#1D7A6F] hover:bg-[#E8F5F3] border border-[#C8E3DC] transition-colors shadow-2xs cursor-pointer"
          title="Tes status koneksi Google Sheets & Token"
        >
          <Activity className="w-3.5 h-3.5 text-[#1D7A6F]" />
          <span className="hidden sm:inline">Tes Koneksi</span>
        </button>

        {/* Tautan Lembar Kerja Google Sheets Asli */}
        <a
          href={editUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs sm:text-sm font-semibold bg-[#1D7A6F] text-white hover:bg-[#155D54] border border-[#155D54] transition-colors shadow-2xs cursor-pointer"
          title="Buka Spreadsheet di Google Drive"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{title}</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      {/* Modal Diagnostik Koneksi */}
      <DiagnosticModal
        isOpen={showDiagnostic}
        onClose={() => setShowDiagnostic(false)}
      />
    </>
  );
}
