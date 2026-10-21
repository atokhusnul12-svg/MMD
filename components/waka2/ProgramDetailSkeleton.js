import React from 'react';

/**
 * ProgramDetailSkeleton — Skeleton loading seukuran konten asli halaman detail program WAKA II
 * Menjamin tidak terjadi layout shift (CLS) saat berpindah antar program atau memuat data presensi.
 */
export default function ProgramDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat data program WAKA II">
      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3.5 w-48 bg-[#E5E2D9] rounded-md" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-60 bg-[#E0DDD2] rounded-lg" />
            <div className="h-6 w-20 bg-[#E0DDD2] rounded-full hidden sm:block" />
          </div>
          <div className="h-4 w-80 sm:w-96 bg-[#E8E5DC] rounded-md" />
        </div>

        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-[#E0DDD2] rounded-lg" />
          <div className="h-9 w-24 bg-[#E0DDD2] rounded-lg" />
        </div>
      </div>

      {/* 2. Navigasi Tab */}
      <div className="border-b border-[#DCE5E0] flex gap-2">
        <div className="h-10 w-36 bg-[#E8E5DC] rounded-t-lg" />
        <div className="h-10 w-36 bg-[#EFECE3] rounded-t-lg" />
      </div>

      {/* 3. 4 Kartu Metrik Kehadiran */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-[#DCE5E0] bg-white space-y-2 shadow-2xs">
            <div className="h-3 w-20 bg-[#E8E5DC] rounded-md" />
            <div className="h-7 w-16 bg-[#DCD8CC] rounded-lg" />
            <div className="h-3 w-24 bg-[#E8E5DC] rounded-md" />
          </div>
        ))}
      </div>

      {/* 4. Panel Tabel Presensi */}
      <div className="bg-white rounded-xl border border-[#DCE5E0] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#DCE5E0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="h-5 w-64 bg-[#E0DDD2] rounded-md" />
          <div className="h-9 w-48 bg-[#EAE7DE] rounded-xl" />
        </div>

        <div className="p-4 min-h-[350px] space-y-3">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="h-10 w-full bg-[#FAF6EF] rounded-lg flex items-center justify-between px-4">
              <div className="h-3.5 w-32 bg-[#E0DDD2] rounded-md" />
              <div className="h-3.5 w-16 bg-[#EAE7DE] rounded-md" />
              <div className="h-5 w-12 bg-[#E0DDD2] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
