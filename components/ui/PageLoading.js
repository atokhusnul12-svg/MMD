import React from 'react';

/**
 * Komponen loading spinner standar untuk Suspense fallback di seluruh rute halaman MMD.
 * Menjamin tampilan loading yang seragam, elegan, dan konsisten.
 */
export default function PageLoading({
  message = 'Memuat data...',
  minHeight = 'min-h-[400px]',
}) {
  return (
    <div className={`flex items-center justify-center ${minHeight}`}>
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#1D7A6F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-[#5C6B64]">{message}</p>
      </div>
    </div>
  );
}
