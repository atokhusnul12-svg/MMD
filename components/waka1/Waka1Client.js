'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Printer,
  AlertCircle,
} from 'lucide-react';
import Waka1SummaryCards from './Waka1SummaryCards';
import Waka1Table from './Waka1Table';
import Waka1Aggregations from './Waka1Aggregations';

export default function Waka1Client({ initialData, serverError = null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const data = initialData;
  const error = serverError;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setIsRefreshing(false);
    });
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const spinning = isRefreshing || isPending;
  const summary = data?.summary || {};
  const tingkatStats = data?.tingkatStats || {};
  const monthlyCounts = data?.monthlyCounts || {};
  const bulanList = data?.bulanList || [];

  return (
    <div className="space-y-6">
      {/* Header Halaman WAKA I */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#5C6E66] mb-1">
            <Link href="/" className="hover:text-[#1D7A6F] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 text-[#C6A66B]" /> HOME
            </Link>
            <span>/</span>
            <span className="text-[#1D7A6F] font-bold">WAKA I MMD</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332E] tracking-tight font-serif flex items-center gap-2">
            <span>Data Santri dan Takziran</span>
            <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] hidden sm:inline-flex">
              MI • MTs • MA
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E66] mt-1 max-w-2xl">
            Pusat informasi data santri, evaluasi kedisiplinan, dan rekapitulasi takziran bulanan santri Madrasah Islamiyah Darussalamah.
          </p>
        </div>

        {/* Tombol Aksi Kanan */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F] text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#1D7A6F]" />
            <span>Cetak Data</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={spinning}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#1D7A6F] hover:bg-[#F7F5EF] text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Segarkan data dari Google Sheets"
          >
            <RefreshCw className={`w-4 h-4 text-[#1D7A6F] ${spinning ? 'animate-spin' : ''}`} />
            <span>{spinning ? 'Menyinkronkan...' : 'Perbarui'}</span>
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="bg-[#FAF0ED] border border-[#E8BCB0] text-[#8A2F1B] rounded-xl p-4 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#8A2F1B] mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            <button
              onClick={handleRefresh}
              className="underline text-xs mt-1 cursor-pointer font-medium hover:text-[#5C1F12]"
            >
              Coba Muat Ulang
            </button>
          </div>
        </div>
      )}

      {/* 4 Kartu Ringkasan Kedisiplinan Siswa */}
      <Waka1SummaryCards
        summary={summary}
        statusFilter={statusFilter}
        onSelectStatusFilter={setStatusFilter}
      />

      {/* Tabel Data Utama Siswa & Pelanggaran */}
      <Waka1Table
        students={data?.students || []}
        bulanList={bulanList}
        classes={data?.classes || []}
        domisiliList={data?.domisiliList || []}
        sourceUrl={data?.sourceUrl}
        statusFilter={statusFilter}
        onSelectStatusFilter={setStatusFilter}
      />

      {/* Panel Agregasi: Distribusi Tingkat & Tren Bulanan */}
      <Waka1Aggregations
        tingkatStats={tingkatStats}
        monthlyCounts={monthlyCounts}
        bulanList={bulanList}
      />
    </div>
  );
}
