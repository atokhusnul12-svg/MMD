'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  FileText,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';
import AbsensiTable from './AbsensiTable';
import JurnalViewer from './JurnalViewer';

export default function ProgramDetailClient({
  program,
  initialData,
  serverError = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialTab = searchParams.get('tab') === 'jurnal' ? 'jurnal' : 'absensi';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(serverError);
  const [data, setData] = useState(initialData);

  // Sinkronkan tab jika query parameter berubah
  useEffect(() => {
    const qTab = searchParams.get('tab');
    if (qTab === 'jurnal' || qTab === 'absensi') {
      setActiveTab(qTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Perbarui query param tanpa reload penuh
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setIsRefreshing(false);
    });
  };

  const spinning = isRefreshing || isPending;

  return (
    <div className="space-y-6">
      {/* Header Program & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#5C6E66] mb-1">
            <Link href="/" className="hover:text-[#1D7A6F] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 text-[#C6A66B]" /> Dashboard
            </Link>
            <span>/</span>
            <Link href="/waka-ii" className="hover:text-[#1D7A6F] transition-colors">
              WAKA II MMD
            </Link>
            <span>/</span>
            <span className="text-[#1D7A6F] font-bold">{program.name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332E] tracking-tight font-serif flex items-center gap-2">
            <span>{program.name}</span>
            <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#FAF3E6] text-[#8C6D23] border border-[#ECD8A5] hidden sm:inline-flex">
              {program.tingkat}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E66] mt-1 max-w-2xl">
            {program.description}
          </p>
        </div>

        {/* Tombol Aksi Kanan */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'absensi' && (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') window.print();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F] text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#1D7A6F]" />
              <span>Cetak Presensi</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={spinning}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#1D7A6F] hover:bg-[#F7F5EF] text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Muat ulang data terkini dari server"
          >
            <RefreshCw className={`w-4 h-4 text-[#1D7A6F] ${spinning ? 'animate-spin' : ''}`} />
            <span>{spinning ? 'Menyinkronkan...' : 'Perbarui'}</span>
          </button>
        </div>
      </div>

      {/* Navigasi 2 Tab Utama: Absensi Anggota vs Jurnal Pembahasan */}
      <div className="border-b border-[#DCE5E0]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('absensi')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'absensi'
                ? 'border-[#1D7A6F] text-[#1D7A6F] bg-[#F7F5EF]/50 rounded-t-lg'
                : 'border-transparent text-[#5C6E66] hover:text-[#26332E] hover:border-[#DCE5E0]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Absensi Anggota</span>
            {data?.summary?.totalSantri && (
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-[#1D7A6F]/10 text-[#1D7A6F]">
                {data.summary.totalSantri}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('jurnal')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'jurnal'
                ? 'border-[#8C6D23] text-[#8C6D23] bg-[#FAF3E6]/40 rounded-t-lg'
                : 'border-transparent text-[#5C6E66] hover:text-[#26332E] hover:border-[#DCE5E0]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#8C6D23]" />
            <span>Jurnal Pembahasan</span>
            <span className="text-[11px] font-sans px-1.5 py-0.2 rounded-full bg-[#8C6D23]/10 text-[#8C6D23]">
              Google Docs
            </span>
          </button>
        </div>
      </div>

      {/* Error Banner jika pengambilan data gagal */}
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

      {/* Konten Tab Aktif */}
      {activeTab === 'absensi' ? (
        <AbsensiTable
          members={data?.members || []}
          availableMonths={data?.availableMonths || []}
          monthlyAggregates={data?.monthlyAggregates || []}
          summary={data?.summary || {}}
          sourceUrl={program.csvUrl}
          classes={data?.classes || []}
          domisiliList={data?.domisiliList || []}
        />
      ) : (
        <JurnalViewer
          jurnalUrl={program.jurnalDocUrl}
          programName={program.name}
          tingkat={program.tingkat}
        />
      )}
    </div>
  );
}
