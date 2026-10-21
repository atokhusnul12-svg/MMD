import React from 'react';

/**
 * Waka1Skeleton — Skeleton loading seukuran konten asli halaman WAKA I
 * Menggantikan generic spinner agar tidak terjadi layout shift (CLS) saat data tiba.
 * Desain tenang, menggunakan palet cream (#F7F5EF) dan abu-abu kehijauan halus.
 */
export default function Waka1Skeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat data santri WAKA I">
      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          {/* Breadcrumbs skeleton */}
          <div className="h-3.5 w-32 bg-[#E5E2D9] rounded-md" />
          {/* Judul & badge */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-64 bg-[#E0DDD2] rounded-lg" />
            <div className="h-6 w-24 bg-[#E0DDD2] rounded-full hidden sm:block" />
          </div>
          {/* Deskripsi */}
          <div className="h-4 w-80 sm:w-96 bg-[#E8E5DC] rounded-md" />
        </div>

        {/* Tombol aksi kanan */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-[#E0DDD2] rounded-lg" />
          <div className="h-9 w-24 bg-[#E0DDD2] rounded-lg" />
        </div>
      </div>

      {/* 2. 4 Kartu Ringkasan Metrik Kedisiplinan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl border border-[#DCE5E0] bg-white space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[#E8E5DC] rounded-md" />
              <div className="w-8 h-8 rounded-lg bg-[#EAE7DE]" />
            </div>
            <div className="h-8 w-24 bg-[#DCD8CC] rounded-lg" />
            <div className="h-3.5 w-28 bg-[#E8E5DC] rounded-md" />
          </div>
        ))}
      </div>

      {/* 3. Panel Tabel Utama */}
      <div className="bg-white rounded-2xl border border-[#DCE5E0] shadow-xs overflow-hidden">
        {/* Filter bar skeleton */}
        <div className="p-4 sm:p-5 border-b border-[#DCE5E0] space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="h-9 w-full sm:w-72 bg-[#EAE7DE] rounded-xl" />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="h-9 w-28 bg-[#EAE7DE] rounded-xl" />
              <div className="h-9 w-28 bg-[#EAE7DE] rounded-xl" />
              <div className="h-9 w-28 bg-[#EAE7DE] rounded-xl hidden md:block" />
            </div>
          </div>
        </div>

        {/* Table Rows skeleton */}
        <div className="overflow-x-auto min-h-[480px]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#DCE5E0] bg-[#FAF6EF]/80">
                <th className="py-3 px-4 w-12"><div className="h-3 w-6 bg-[#E0DDD2] rounded-md mx-auto" /></th>
                <th className="py-3 px-4"><div className="h-3 w-28 bg-[#E0DDD2] rounded-md" /></th>
                <th className="py-3 px-4"><div className="h-3 w-16 bg-[#E0DDD2] rounded-md" /></th>
                <th className="py-3 px-4"><div className="h-3 w-24 bg-[#E0DDD2] rounded-md" /></th>
                <th className="py-3 px-4"><div className="h-3 w-20 bg-[#E0DDD2] rounded-md mx-auto" /></th>
                <th className="py-3 px-4"><div className="h-3 w-36 bg-[#E0DDD2] rounded-md" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFE9]">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                <tr key={row}>
                  <td className="py-3 px-4"><div className="h-3 w-4 bg-[#EAE7DE] rounded-md mx-auto" /></td>
                  <td className="py-3 px-4 space-y-1.5">
                    <div className="h-3.5 w-40 bg-[#DFDBD0] rounded-md" />
                    <div className="h-2.5 w-24 bg-[#EAE7DE] rounded-md" />
                  </td>
                  <td className="py-3 px-4"><div className="h-5 w-12 bg-[#EAE7DE] rounded-md" /></td>
                  <td className="py-3 px-4"><div className="h-3.5 w-20 bg-[#EAE7DE] rounded-md" /></td>
                  <td className="py-3 px-4"><div className="h-6 w-20 bg-[#EAE7DE] rounded-full mx-auto" /></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <div className="h-5 w-12 bg-[#EAE7DE] rounded-md" />
                      <div className="h-5 w-12 bg-[#EAE7DE] rounded-md" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination skeleton */}
        <div className="px-5 py-3.5 bg-[#FAF6EF]/60 border-t border-[#DCE5E0] flex items-center justify-between">
          <div className="h-3.5 w-32 bg-[#E5E2D9] rounded-md" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 bg-[#E5E2D9] rounded-lg" />
            <div className="h-7 w-12 bg-[#DCD8CC] rounded-lg" />
            <div className="h-7 w-20 bg-[#E5E2D9] rounded-lg" />
          </div>
        </div>
      </div>

      {/* 4. Panel Agregasi Bawah */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Panel Tingkat */}
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#DCE5E0] space-y-4">
          <div className="h-4 w-48 bg-[#E0DDD2] rounded-md" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3.5 rounded-xl bg-[#F7F5EF] border border-[#DCE5E0] space-y-2">
                <div className="h-3 w-8 bg-[#DFDBD0] rounded-md mx-auto" />
                <div className="h-5 w-16 bg-[#DCD8CC] rounded-md mx-auto" />
                <div className="h-2 w-full bg-[#E5E2D9] rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Panel Tren Bulanan */}
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#DCE5E0] space-y-4">
          <div className="h-4 w-48 bg-[#E0DDD2] rounded-md" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-2.5 rounded-xl bg-[#F7F5EF] border border-[#DCE5E0] space-y-1.5">
                <div className="h-2.5 w-10 bg-[#DFDBD0] rounded-md mx-auto" />
                <div className="h-5 w-8 bg-[#DCD8CC] rounded-md mx-auto" />
                <div className="h-1.5 w-full bg-[#E5E2D9] rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
