'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import { ExternalLink, Edit3 } from 'lucide-react';

/**
 * Komponen tombol "Edit Data di Google Sheets"
 * Hanya muncul ketika Admin sedang Login!
 */
export default function AdminButton({ editUrl, title = "Edit Data di Google Sheets" }) {
  const { isAdmin, isLoaded } = useAuth();

  // Jangan tampilkan jika bukan admin atau auth belum dimuat
  if (!isLoaded || !isAdmin) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={editUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#2A9D8F] text-white hover:bg-[#1D7A6F] shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
      >
        <Edit3 className="w-4 h-4" />
        <span>{title}</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
      </a>
    </div>
  );
}
