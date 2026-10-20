'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { DATA_LINKS } from '@/lib/dataLinks';
import {
  getAnggotaData,
  getBahsuData,
  getKalenderData,
} from '@/lib/fetchCSV';
import StatCard from '@/components/StatCard';
import PieChart from '@/components/PieChart';
import AdminButton from '@/components/AdminButton';
import {
  Users,
  TrendingUp,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Clock,
  Hourglass,
  CheckCircle2,
  XCircle,
  Printer,
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '@/components/PrintHeaderFooter';
import { smartScrollTo } from '@/lib/scrollTo';
import { useBackgroundSync } from '@/lib/useBackgroundSync';

export default function DashboardClient({ initialData }) {
  const hasInitial = Boolean(initialData?.anggotaData || initialData?.bahsuData);
  const [anggotaData, setAnggotaData] = useState(initialData?.anggotaData || null);
  const [bahsuData, setBahsuData] = useState(initialData?.bahsuData || null);
  const [kalenderData, setKalenderData] = useState(initialData?.kalenderData || null);
  const [loading, setLoading] = useState(!hasInitial);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(hasInitial ? 'Sinkron Server' : null);
  const lastFetchRef = useRef(0);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Filter status Bahsu di card jadwal: 'BELUM' | 'SUDAH' | 'ALL'
  const [bahsuFilter, setBahsuFilter] = useState('BELUM');

  /**
   * Fungsi memuat seluruh data WAKA III dari Google Sheets.
   * Mendukung pembaruan latar belakang (background refresh) tanpa memutus tampilan.
   */
  const loadData = async (showFullLoading = true) => {
    try {
      await Promise.resolve();
      if (showFullLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const [resAnggota, resBahsu, resKalender] = await Promise.allSettled([
        getAnggotaData(DATA_LINKS.anggota.csvUrl),
        getBahsuData(DATA_LINKS.bahsu.csvUrl),
        getKalenderData(DATA_LINKS.kalender.csvUrl),
      ]);

      const failedSources = [];

      if (resAnggota.status === 'fulfilled') {
        setAnggotaData(resAnggota.value);
      } else {
        console.error('Gagal memuat anggota:', resAnggota.reason);
        failedSources.push(`Anggota LBM (${resAnggota.reason?.message || 'Error'})`);
      }

      if (resBahsu.status === 'fulfilled') {
        setBahsuData(resBahsu.value);
      } else {
        console.error('Gagal memuat bahsu:', resBahsu.reason);
        failedSources.push(`Bahtsul Masail (${resBahsu.reason?.message || 'Error'})`);
      }

      if (resKalender.status === 'fulfilled') {
        setKalenderData(resKalender.value);
      } else {
        console.error('Gagal memuat kalender:', resKalender.reason);
      }

      if (failedSources.length === 2) {
        setError(`Data WAKA III gagal dimuat. Detail: ${failedSources.join('; ')}`);
      }

      setLastRefreshed(new Date().toLocaleTimeString('id-ID'));
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error('Gagal mengambil data CSV Google Sheets:', err);
      setError('Terjadi kendala saat mengambil data langsung dari Google Sheets. Pastikan koneksi internet aktif.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Sinkronisasi data saat halaman dibuka
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(!hasInitial);
    }, 0);
    return () => clearTimeout(timer);
  }, [hasInitial]);

  // Sinkronisasi otomatis di latar belakang & saat tab aktif kembali
  useBackgroundSync(() => loadData(false), { lastFetchRef });

  // Filter daftar agenda Bahtsul Masail yang ditampilkan
  const displayedBahsuEvents = useMemo(() => {
    if (!bahsuData?.events) return [];
    if (bahsuFilter === 'BELUM') {
      return bahsuData.events.filter((e) => e.statusKeberangkatan === 'BELUM_BERANGKAT');
    }
    if (bahsuFilter === 'SUDAH') {
      return bahsuData.events.filter((e) => e.statusKeberangkatan === 'SUDAH_BERANGKAT');
    }
    return bahsuData.events;
  }, [bahsuData, bahsuFilter]);

  return (
    <div className="space-y-7">
      {/* KOP SURAT RESMI CETAK (HANYA MUNCUL DI PRINT / PDF) */}
      <PrintHeader
        title="Laporan Administrasi WAKA III — Lembaga Bahtsul Masail (LBM)"
        subtitle="Pondok Pesantren Darussalam Sumbersari Kencong Pare Kediri"
        filterInfo="Tahun Ajaran 1447-1448 H / 2026-2027 M"
        totalInfo={`${anggotaData?.total ?? initialData?.anggotaTotal ?? '…'} Santri LBM | ${bahsuData?.totalAgenda ?? initialData?.bahsuTotal ?? '…'} Forum Bahtsul Masail | ${bahsuData?.totalSudahBerangkat ?? '…'} Selesai Berangkat | ${bahsuData?.totalBelumBerangkat ?? '…'} Mendatang`}
      />

      {/* ============================================================== */}
      {/* 1. BANNER SAMBUTAN, STATUS LIVE REAL-TIME & SINKRONISASI         */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl p-5 sm:p-7 border border-[#DCE5E0] shadow-xs no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="text-xs text-[#5C6E66] mb-1 font-medium">
              Madrasah Islamiyah Darussalamah, PP. Darussalam Sumbersari
            </div>
            <h1
              dir="rtl"
              lang="ar"
              className="text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1D7A6F] tracking-normal font-diwani leading-tight sm:leading-snug py-1 w-fit"
            >
              لجنة بحث المسائل
            </h1>
            <p className="text-xs sm:text-sm text-[#5C6E66] mt-1.5 leading-relaxed">
              Pusat pembinaan {anggotaData?.total || initialData?.anggotaTotal || '…'} santri Lembaga Bahtsul Masail (LBM), koordinasi {bahsuData?.totalAgenda || initialData?.bahsuTotal || '…'} forum delegasi Bahtsul Masail se-Jawa Madura, serta administrasi kepengurusan WAKA III.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Tombol Cetak Laporan */}
            <button
              onClick={handlePrint}
              disabled={loading || isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
              title="Cetak Laporan Eksekutif Administrasi WAKA III atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-[#1D7A6F]" />
              <span>Cetak Laporan</span>
            </button>
            <button
              onClick={() => loadData(true)}
              disabled={loading || isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#1D7A6F] hover:bg-[#F7F5EF] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
              title="Perbarui data langsung dari Google Sheets sekarang"
            >
              <RefreshCw className={`w-4 h-4 text-[#1D7A6F] ${loading || isRefreshing ? 'animate-spin' : ''}`} />
              <span>{loading || isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
            </button>
            <AdminButton editUrl={DATA_LINKS.anggota.editUrl} title="Edit di Sheets" />
          </div>
        </div>

        {/* Status Sinkronisasi Real-Time */}
        <div className="mt-5 pt-4 border-t border-[#DCE5E0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#5C6E66]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D7A6F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D7A6F]"></span>
            </span>
            <span className="font-semibold text-[#1D7A6F]">
              Live Auto-Sync Google Sheets Aktif
            </span>
            <span className="text-[#DCE5E0]">•</span>
            <span>Auto-refresh 3 menit &amp; saat tab aktif</span>
          </div>

          {lastRefreshed && (
            <div className="flex items-center gap-1.5 text-[#5C6E66]">
              <Clock className="w-3.5 h-3.5 text-[#C6A66B]" />
              <span>
                Pembaruan terakhir: <strong className="text-[#26332E] font-mono">{lastRefreshed} WIB</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* PINTASAN CEPAT BAGIAN WAKA III (SMART AUTO-SCROLL BAR)         */}
      {/* ============================================================== */}
      <div className="bg-[#FAF6EF]/60 rounded-xl p-3 sm:p-3.5 border border-[#DCE5E0] no-print flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1D7A6F]">
          <Sparkles className="w-3.5 h-3.5 text-[#C6A66B]" />
          <span>Pintasan Bagian WAKA III:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => smartScrollTo('waka3-statistik')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#E8F5F3] text-[#26332E] hover:text-[#1D7A6F] border border-[#DCE5E0] transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#1D7A6F]" />
            <span>Statistik</span>
          </button>
          <button
            type="button"
            onClick={() => smartScrollTo('waka3-charts')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#E8F5F3] text-[#26332E] hover:text-[#1D7A6F] border border-[#DCE5E0] transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#1D7A6F]" />
            <span>Santri LBM</span>
          </button>
          <button
            type="button"
            onClick={() => smartScrollTo('waka3-bahsu')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#E8F5F3] text-[#26332E] hover:text-[#1D7A6F] border border-[#DCE5E0] transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#1D7A6F]" />
            <span>Delegasi Bahsu</span>
          </button>
        </div>
      </div>


      {/* Alert Error Jika Ada Masalah Fetch */}
      {error && (
        <div className="bg-[#FAF0ED] border border-[#E8BCB0] text-[#8A2F1B] rounded-xl p-4 sm:p-5 flex items-start gap-3 no-print">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#8A2F1B] mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Gagal Mengambil Data Google Sheets</h4>
            <p className="text-xs mt-1 text-[#8A2F1B]">{error}</p>
            <button
              onClick={() => loadData(true)}
              className="mt-2 text-xs font-semibold text-[#8A2F1B] underline hover:no-underline"
            >
              Coba lagi sekarang
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. METRIK UTAMA OPERASIONAL WAKA III (SANTRI & DELEGASI BAHSU)   */}
      {/* ============================================================== */}
      <div id="waka3-statistik" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-avoid-break scroll-mt-28 sm:scroll-mt-36">
        {/* Kartu 1: Total Anggota LBM */}
        <StatCard
          index={0}
          title="Total Anggota LBM"
          value={`${anggotaData?.total || 0} Santri`}
          subvalue="Terdaftar aktif di sistem MMD"
          icon={Users}
          badgeText="LBM MMD"
          badgeColor="bg-[#F0F4FA] text-[#0A192F] border-[#D0DDEB]"
          iconBg="bg-[#F0F4FA]"
          iconColor="text-[#0A192F]"
          isLoading={loading}
          href="/anggota"
          actionHint="Buka Data →"
          titleTooltip="Klik untuk membuka Halaman Data Anggota LBM"
          ariaLabel="Buka halaman Data Anggota LBM"
        />

        {/* Kartu 2: Forum Bahtsul Masail */}
        <StatCard
          index={1}
          title="Forum Bahtsul Masail"
          value={`${bahsuData?.totalAgenda || 0} Forum`}
          subvalue={`${bahsuData?.totalSudahBerangkat || 0} Sudah • ${bahsuData?.totalBelumBerangkat || 0} Belum • ${bahsuData?.totalIzin || 0} Izin`}
          icon={BookOpen}
          iconBg="bg-[#FAF3E6]"
          iconColor="text-[#8C6D23]"
          badgeText="Agenda 2026"
          badgeColor="bg-[#FAF3E6] text-[#8C6D23] border-[#E8D5A7]"
          isLoading={loading}
          href="/bahsu"
          actionHint="Buka Jadwal →"
          titleTooltip="Klik untuk membuka Halaman Jadwal & Delegasi Bahtsul Masail"
          ariaLabel="Buka halaman Pemberangkatan Bahtsul Masail"
        />

        {/* Kartu 3: Delegasi Selesai Berangkat */}
        <StatCard
          index={2}
          title="Delegasi Selesai"
          value={`${bahsuData?.totalSudahBerangkat || 0} Forum`}
          subvalue="Sudah selesai diberangkatkan"
          icon={CheckCircle2}
          iconBg="bg-[#E8F5F3]"
          iconColor="text-[#1D7A6F]"
          badgeText="Terealisasi"
          badgeColor="bg-[#E8F5F3] text-[#1D7A6F] border-[#C8E3DC]"
          isLoading={loading}
          href="/bahsu"
          actionHint="Lihat Detail →"
          titleTooltip="Klik untuk melihat agenda yang sudah selesai diberangkatkan"
          ariaLabel="Buka detail agenda bahtsul masail yang sudah berangkat"
        />

        {/* Kartu 4: Delegasi Menunggu / Belum Berangkat */}
        <StatCard
          index={3}
          title="Delegasi Mendatang"
          value={`${bahsuData?.totalBelumBerangkat || 0} Forum`}
          subvalue="Menunggu jadwal keberangkatan"
          icon={Hourglass}
          iconBg="bg-[#FAF3E6]"
          iconColor="text-[#8C6D23]"
          badgeText="Persiapan"
          badgeColor="bg-[#FAF3E6] text-[#8C6D23] border-[#E8D5A7]"
          isLoading={loading}
          href="/bahsu"
          actionHint="Lihat Jadwal →"
          titleTooltip="Klik untuk melihat jadwal pemberangkatan forum berikutnya"
          ariaLabel="Buka detail agenda bahtsul masail mendatang"
        />
      </div>

      {/* ============================================================== */}
      {/* 4. DISTRIBUSI STATUS ANGGOTA + PIE CHART                       */}
      {/* ============================================================== */}
      <div id="waka3-charts" className="grid grid-cols-1 gap-6 print-avoid-break scroll-mt-28 sm:scroll-mt-36">
        {loading ? (
          <div className="bg-white rounded-xl p-8 border border-[#DCE5E0] animate-pulse flex flex-col md:flex-row items-center justify-around gap-6 min-h-[260px]">
            <div className="w-44 h-44 rounded-full bg-stone-200/80 animate-pulse"></div>
            <div className="space-y-3 w-full max-w-sm">
              <div className="h-4 bg-stone-200 rounded w-3/4"></div>
              <div className="h-4 bg-stone-200 rounded w-1/2"></div>
              <div className="h-4 bg-stone-200 rounded w-2/3"></div>
              <div className="h-4 bg-stone-200 rounded w-3/5"></div>
            </div>
          </div>
        ) : (
          <PieChart
            statusCounts={anggotaData?.statusCounts || {}}
            total={anggotaData?.total || 0}
          />
        )}
      </div>

      {/* ============================================================== */}
      {/* 5. JADWAL & DELEGASI BAHTSUL MASAIL (FULL WIDTH)               */}
      {/* ============================================================== */}
      <div
        id="waka3-bahsu"
        className="bg-white rounded-xl p-5 sm:p-7 border border-[#DCE5E0] shadow-xs flex flex-col justify-between print-avoid-break scroll-mt-28 sm:scroll-mt-36"
      >
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#DCE5E0]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#FAF3E6] text-[#8C6D23] text-[11px] font-bold border border-[#E8D5A7] mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#8C6D23]" />
                Forum Musyawarah Ilmiah
              </div>
              <h3 className="font-extrabold text-xl text-[#26332E] font-serif">
                Jadwal &amp; Delegasi Bahtsul Masail
              </h3>
              <p className="text-xs sm:text-sm text-[#5C6E66] mt-0.5">
                Total {bahsuData?.totalAgenda || 0} forum musyawarah delegasi santri LBM se-Jawa Madura
              </p>
            </div>

            {/* Tab Filter Cepat Status Bahsu */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F7F5EF] border border-[#DCE5E0] text-xs font-semibold no-print self-start sm:self-auto">
              <button
                onClick={() => setBahsuFilter('BELUM')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  bahsuFilter === 'BELUM'
                    ? 'bg-[#FAF3E6] text-[#8C6D23] font-bold border border-[#E8D5A7] shadow-xs'
                    : 'text-[#5C6E66] hover:text-[#26332E]'
                }`}
              >
                Belum ({bahsuData?.totalBelumBerangkat || 0})
              </button>
              <button
                onClick={() => setBahsuFilter('SUDAH')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  bahsuFilter === 'SUDAH'
                    ? 'bg-[#E8F5F3] text-[#1D7A6F] font-bold border border-[#C8E3DC] shadow-xs'
                    : 'text-[#5C6E66] hover:text-[#26332E]'
                }`}
              >
                Sudah ({bahsuData?.totalSudahBerangkat || 0})
              </button>
              <button
                onClick={() => setBahsuFilter('ALL')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  bahsuFilter === 'ALL'
                    ? 'bg-[#1D7A6F] text-white font-bold shadow-xs'
                    : 'text-[#5C6E66] hover:text-[#26332E]'
                }`}
              >
                Semua ({bahsuData?.totalAgenda || 0})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedBahsuEvents.length > 0 ? (
              displayedBahsuEvents.slice(0, 8).map((item, idx) => (
                <Link
                  key={item.id || idx}
                  href="/bahsu"
                  className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] flex items-start justify-between gap-3 hover:bg-[#F0F4FA]/50 hover:border-[#0A192F]/40 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A192F] select-none"
                  title={`Buka detail agenda forum "${item.acara}" di Halaman Bahtsul Masail`}
                  aria-label={`Buka detail agenda forum ${item.acara}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-[#0A192F] bg-[#F0F4FA] border border-[#D0DDEB] px-2 py-0.5 rounded font-mono">
                        #{item.no || idx + 1}
                      </span>
                      <span className="text-xs text-[#475569] flex items-center gap-1 font-medium font-mono">
                        <Clock className="w-3 h-3 text-[#C6A66B]" />
                        {item.tanggal}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0A192F] line-clamp-1 group-hover:text-[#C5A059] transition-colors duration-200">
                      {item.acara}
                    </h4>
                    {item.delegasi && item.delegasi.length > 0 && (
                      <p className="text-[11px] text-[#475569] mt-1 line-clamp-1">
                        Delegasi: {item.delegasi.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {item.statusKeberangkatan === 'BELUM_BERANGKAT' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF3E6] text-[#8C6D23] border border-[#E8D5A7] flex items-center gap-1">
                        <Hourglass className="w-3 h-3 text-[#8C6D23]" />
                        Belum
                      </span>
                    )}
                    {item.statusKeberangkatan === 'SUDAH_BERANGKAT' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#1D7A6F]" />
                        Sudah
                      </span>
                    )}
                    {item.statusKeberangkatan === 'IZIN' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF0ED] text-[#8A2F1B] border border-[#E8BCB0] flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-[#8A2F1B]" />
                        Izin / Batal
                      </span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full p-8 text-center text-[#5C6E66] text-xs bg-[#F7F5EF] rounded-xl border border-[#DCE5E0]">
                Tidak ada agenda forum dalam kategori ini.
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#DCE5E0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5C6E66] gap-2 no-print">
          <span>
            Menampilkan {Math.min(8, displayedBahsuEvents.length)} dari {displayedBahsuEvents.length} forum aktif
          </span>
          <Link
            href="/bahsu"
            className="font-bold text-[#1D7A6F] hover:underline flex items-center gap-1.5"
          >
            <span>Buka Seluruh Jadwal &amp; Delegasi Bahtsul Masail</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C6A66B]" />
          </Link>
        </div>
      </div>



      {/* Tanda Tangan Resmi Pengesahan Laporan */}
      <PrintSignatures leftRole="Kepala MMD Darussalamah" rightRole="WAKA III MMD Darussalamah" />
    </div>
  );
}
