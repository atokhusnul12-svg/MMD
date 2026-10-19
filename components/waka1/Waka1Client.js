'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Printer,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import Waka1SummaryCards from './Waka1SummaryCards';
import Waka1Table from './Waka1Table';

export default function Waka1Client({ initialData, serverError = null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(serverError);
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
              <ArrowLeft className="w-3.5 h-3.5 text-[#C6A66B]" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#1D7A6F] font-bold">WAKA I MMD</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332E] tracking-tight font-serif flex items-center gap-2">
            <span>WAKA I — Kesiswaan &amp; Ketertiban</span>
            <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] hidden sm:inline-flex">
              MI • MTs • MA
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E66] mt-1 max-w-2xl">
            Pusat pendataan siswa, monitoring kedisiplinan, dan rekapitulasi takziran bulanan santri Madrasah Islamiyah Darussalamah
          </p>
        </div>

        {/* Tombol Aksi Kanan */}
        <div className="flex flex-wrap items-center gap-2">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* 1. Rekapitulasi Tingkat Madrasah */}
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#DCE5E0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#26332E] font-serif flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1D7A6F]" />
              <span>Kedisiplinan per Tingkat Madrasah</span>
            </h3>
            <span className="text-xs text-[#5C6E66]">MI, MTs, MA</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {['MI', 'MTs', 'MA'].map((t) => {
              const stat = tingkatStats[t] || { total: 0, bebas: 0, takzir: 0 };
              const persenBebas =
                stat.total > 0 ? Math.round((stat.bebas / stat.total) * 100) : 0;

              return (
                <div
                  key={t}
                  className="p-3.5 rounded-xl bg-[#F7F5EF]/70 border border-[#DCE5E0] space-y-1"
                >
                  <span className="text-xs font-black text-[#1D7A6F] block">{t}</span>
                  <span className="text-lg font-black text-[#26332E] font-serif block">
                    {stat.total} Siswa
                  </span>
                  <div className="pt-1 text-[11px] font-semibold text-[#1D7A6F]">
                    {persenBebas}% Tertib
                  </div>
                  <span className="text-[10px] text-[#8A2F1B] block">
                    {stat.takzir} Kena Takzir
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Tren Takziran per Bulan */}
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#DCE5E0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#26332E] font-serif flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#8C6D23]" />
              <span>Jumlah Santri Takzir per Bulan</span>
            </h3>
            <span className="text-xs text-[#5C6E66]">6 Periode Terdata</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            {bulanList.map((b) => {
              const count = monthlyCounts[b.id] || 0;
              return (
                <div
                  key={b.id}
                  className="p-2.5 rounded-xl bg-[#F7F5EF]/70 border border-[#DCE5E0] space-y-0.5"
                >
                  <span className="text-[10px] font-bold text-[#5C6E66] block truncate">
                    {b.name}
                  </span>
                  <span className="text-base font-black text-[#8A2F1B] font-serif block">
                    {count}
                  </span>
                  <span className="text-[9px] text-[#5C6E66]/80 block">santri</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
