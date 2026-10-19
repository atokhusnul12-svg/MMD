'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { DATA_LINKS } from '@/lib/dataLinks';
import {
  getAnggotaData,
  getKeuanganData,
  getBahsuData,
  getKalenderData,
  formatRupiah,
} from '@/lib/fetchCSV';
import StatCard from '@/components/StatCard';
import PieChart from '@/components/PieChart';
import KeuanganDonutChart from '@/components/KeuanganDonutChart';
import AdminButton from '@/components/AdminButton';
import JamIstiwaCard from '@/components/JamIstiwaCard';
import { AgendaSkeleton } from '@/components/Skeleton';
import {
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Clock,
  BookOpen,
  Hourglass,
  Layers,
  Info,
  CheckCircle2,
  XCircle,
  Activity,
  Printer,
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '@/components/PrintHeaderFooter';

const SYNC_INTERVAL_MS = 180_000;
const REFOCUS_COOLDOWN_MS = 60_000;

export default function DashboardClient({ initialData }) {
  const hasInitial = Boolean(initialData?.anggotaData || initialData?.keuanganData);
  const [anggotaData, setAnggotaData] = useState(initialData?.anggotaData || null);
  const [keuanganData, setKeuanganData] = useState(initialData?.keuanganData || null);
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

  // Filter bulan keuangan interaktif di dashboard
  const [selectedBulan, setSelectedBulan] = useState('TOTAL');

  // Filter status Bahsu di card samping: 'BELUM' | 'SUDAH' | 'ALL'
  const [bahsuFilter, setBahsuFilter] = useState('BELUM');

  /**
   * Fungsi memuat seluruh data dari Google Sheets.
   * Mendukung pembaruan latar belakang (background refresh) tanpa memutus tampilan.
   */
  const loadData = async (showFullLoading = true) => {
    try {
      if (showFullLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const [resAnggota, resKeuangan, resBahsu, resKalender] = await Promise.allSettled([
        getAnggotaData(DATA_LINKS.anggota.csvUrl),
        getKeuanganData(DATA_LINKS.keuangan.csvUrl),
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

      if (resKeuangan.status === 'fulfilled') {
        setKeuanganData(resKeuangan.value);
      } else {
        console.error('Gagal memuat keuangan:', resKeuangan.reason);
        failedSources.push(`Keuangan (${resKeuangan.reason?.message || 'Error'})`);
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
        failedSources.push(`Kalender Kerja (${resKalender.reason?.message || 'Error'})`);
      }

      if (failedSources.length === 4) {
        setError(`Seluruh data source gagal dimuat. Detail: ${failedSources.join('; ')}`);
      } else if (failedSources.length > 0) {
        console.warn('Sebagian data gagal dimuat:', failedSources);
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

  /**
   * SINKRONISASI REAL-TIME:
   * 1. Ambil data saat halaman dibuka
   * 2. Auto-refresh otomatis setiap 3 menit (180 detik)
   * 3. Revalidate on focus/visibility — dengan cooldown 60 detik agar tidak terlalu sering
   */
  useEffect(() => {
    lastFetchRef.current = Date.now();
    if (!hasInitial) {
      loadData(true);
    } else {
      loadData(false);
    }

    const timer = setInterval(() => {
      loadData(false);
    }, SYNC_INTERVAL_MS);

    const throttledRefetch = () => {
      const elapsed = Date.now() - lastFetchRef.current;
      if (elapsed >= REFOCUS_COOLDOWN_MS) {
        loadData(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        throttledRefetch();
      }
    };

    window.addEventListener('focus', throttledRefetch);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', throttledRefetch);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Perhitungan dinamis keuangan berdasarkan bulan yang dipilih (selaras dengan halaman /keuangan)
  const activeKeuangan = useMemo(() => {
    if (!keuanganData) return { subsidi: 0, pengeluaran: 0, saldo: 0, label: 'Memuat...' };

    if (selectedBulan === 'TOTAL') {
      return {
        subsidi: keuanganData.total?.subsidi || 0,
        pengeluaran: keuanganData.total?.pengeluaran || 0,
        saldo: keuanganData.total?.saldo || 0,
        label: `Akumulasi Seluruh (${keuanganData.rekapitulasi?.length || 0} Periode)`,
      };
    }

    const item = keuanganData.rekapitulasi?.find(r => r.bulan === selectedBulan);
    if (item) {
      return {
        subsidi: item.subsidi,
        pengeluaran: item.pengeluaran,
        saldo: item.saldo,
        label: item.bulan,
      };
    }

    return {
      subsidi: keuanganData.total?.subsidi || 0,
      pengeluaran: keuanganData.total?.pengeluaran || 0,
      saldo: keuanganData.total?.saldo || 0,
      label: 'Total Keseluruhan',
    };
  }, [keuanganData, selectedBulan]);

  // Filter daftar agenda Bahtsul Masail yang ditampilkan di kartu
  const displayedBahsuEvents = useMemo(() => {
    if (!bahsuData?.events) return [];
    if (bahsuFilter === 'BELUM') {
      return bahsuData.events.filter(e => e.statusKeberangkatan === 'BELUM_BERANGKAT');
    }
    if (bahsuFilter === 'SUDAH') {
      return bahsuData.events.filter(e => e.statusKeberangkatan === 'SUDAH_BERANGKAT');
    }
    return bahsuData.events;
  }, [bahsuData, bahsuFilter]);

  // Filter daftar agenda Kalender Kerja yang terdekat dengan hari ini / besok
  const upcomingActivities = useMemo(() => {
    if (!kalenderData?.allActivities?.length) return [];

    const MONTH_MAP = {
      'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
      'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
    };

    const parseDate = (act) => {
      if (!act.tanggalLengkap) return null;
      const gregPart = act.tanggalLengkap.split('/')[0].trim();
      const tokens = gregPart.split(' ');
      if (tokens.length >= 3) {
        const day = parseInt(tokens[0]);
        const month = MONTH_MAP[tokens[1]?.toLowerCase()];
        const year = parseInt(tokens[2]);
        if (!isNaN(day) && month !== undefined && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
      return null;
    };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const withDates = kalenderData.allActivities.map((a) => {
      const d = parseDate(a);
      let diffDays = null;
      let statusLabel = '';
      let statusBadge = '';

      if (d) {
        diffDays = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          statusLabel = 'Hari Ini';
          statusBadge = 'bg-[#1D7A6F] text-white';
        } else if (diffDays === 1) {
          statusLabel = 'Besok';
          statusBadge = 'bg-[#FAF3E6] text-[#8C6D23] border border-[#E5D7B7]';
        } else if (diffDays === 2) {
          statusLabel = 'Lusa';
          statusBadge = 'bg-[#EDF3F7] text-[#224A63] border border-[#CCDCE8]';
        } else if (diffDays > 2) {
          statusLabel = `${diffDays} hari lagi`;
          statusBadge = 'bg-[#E8F5F3] text-[#1D7A6F] border border-[#1D7A6F]/20';
        } else {
          statusLabel = `${Math.abs(diffDays)} hari lalu`;
          statusBadge = 'bg-[#F7F5EF] text-[#5C6D66] border border-[#DCE5E0]';
        }
      }

      return {
        ...a,
        parsedDate: d,
        diffDays,
        statusLabel,
        statusBadge,
      };
    });

    let future = withDates
      .filter((a) => a.parsedDate && a.parsedDate >= now)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    // Jika seluruh agenda di kalender telah lewat, cari yang paling mendekati tanggal sekarang
    if (future.length === 0) {
      future = withDates
        .filter((a) => a.parsedDate)
        .sort(
          (a, b) =>
            Math.abs(a.parsedDate.getTime() - now.getTime()) -
            Math.abs(b.parsedDate.getTime() - now.getTime())
        );
    }

    return future.slice(0, 4);
  }, [kalenderData]);

  // Handler auto-scroll halus ke bagian konten dengan sticky header offset
  const scrollToSection = (id) => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-7">
      
      {/* KOP SURAT RESMI CETAK (HANYA MUNCUL DI PRINT / PDF) */}
      <PrintHeader
        title="Laporan Ringkasan Eksekutif Administrasi WAKA III"
        subtitle="Pondok Pesantren Darussalam Sumbersari Kencong Pare Kediri"
        filterInfo={`Tahun Ajaran 1447-1448 H / 2026-2027 M | Periode Anggaran: ${activeKeuangan.label}`}
        totalInfo={`${anggotaData?.total ?? initialData?.anggotaTotal ?? '…'} Santri LBM | ${bahsuData?.totalAgenda ?? initialData?.bahsuTotal ?? '…'} Forum Bahsu | ${kalenderData?.totalKegiatan ?? '…'} Agenda Kalender | Saldo Kas: ${formatRupiah(activeKeuangan.saldo)}`}
      />

      {/* ============================================================== */}
      {/* 1. BANNER SAMBUTAN, STATUS LIVE REAL-TIME & SINKRONISASI         */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl p-5 sm:p-7 border border-[#DCE5E0] shadow-xs relative overflow-hidden no-print">
        {/* Garis aksen emas di bagian atas */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1D7A6F] via-[#C6A66B] to-[#1D7A6F]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-1">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#E8F5F3] text-[#1D7A6F] text-xs font-semibold mb-3 border border-[#C8E3DC]">
              <Sparkles className="w-3.5 h-3.5 text-[#C6A66B]" />
              <span>MMD Madrasah Islamiyah Darussalamah • PP. Darussalam Sumbersari</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#26332E] tracking-tight font-serif">
              Lembaga Bahtsul Masail &amp; Administrasi WAKA III
            </h1>
            <p className="text-sm sm:text-base text-[#5C6E66] mt-2 leading-relaxed">
              Pusat komando pembinaan {anggotaData?.total || initialData?.anggotaTotal || '…'} santri LBM, monitoring agenda kalender kerja madrasah, koordinasi {bahsuData?.totalAgenda || initialData?.bahsuTotal || '…'} forum delegasi Bahtsul Masail, serta transparansi anggaran belanja (RAB &amp; LPJ) secara langsung dari Google Sheets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5">
            {/* Tombol Cetak Laporan */}
            <button
              onClick={handlePrint}
              disabled={loading || isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              title="Cetak Laporan Eksekutif Dashboard atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-[#1D7A6F]" />
              <span>Cetak Laporan</span>
            </button>
            <button
              onClick={() => loadData(true)}
              disabled={loading || isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-[#DCE5E0] bg-white text-[#1D7A6F] hover:bg-[#F7F5EF] text-xs sm:text-sm font-semibold transition-colors duration-150 disabled:opacity-50 shadow-xs cursor-pointer"
              title="Perbarui data langsung dari Google Sheets sekarang"
            >
              <RefreshCw className={`w-4 h-4 text-[#1D7A6F] ${loading || isRefreshing ? 'animate-spin' : ''}`} />
              <span>{loading || isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
            </button>
            <AdminButton editUrl={DATA_LINKS.anggota.editUrl} title="Edit di Sheets" />
          </div>
        </div>

        {/* Status Sinkronisasi Real-Time */}
        <div className="mt-5 pt-3.5 border-t border-[#DCE5E0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C6E66]">
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
              <span>Pembaruan terakhir: <strong className="text-[#26332E] font-mono">{lastRefreshed} WIB</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. KARTU JAM ISTIWA' (WIS) WILAYAH PARE                        */}
      {/* ============================================================== */}
      <div className="no-print">
        <JamIstiwaCard />
      </div>

      {/* ============================================================== */}
      {/* 2.5 PUSAT NOTIFIKASI SISTEM (ONESIGNAL WEB PUSH)              */}
      {/* ============================================================== */}
      <div className="no-print">
        <NotificationButton variant="card" />
      </div>

      {/* ============================================================== */}
      {/* 3. HIGHLIGHT KALENDER KERJA MMD (AGENDA TERDEKAT DARI HARI INI) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl p-5 sm:p-7 border border-[#DCE5E0] shadow-xs print-avoid-break">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#DCE5E0]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#E8F5F3] text-[#1D7A6F] text-[11px] font-bold border border-[#C8E3DC] mb-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[#1D7A6F]" />
              Agenda Terdekat Madrasah
            </div>
            <h3 className="font-extrabold text-xl text-[#26332E] font-serif">
              Sorotan Agenda Kalender Kerja MMD
            </h3>
            <p className="text-xs sm:text-sm text-[#5C6E66] mt-0.5">
              Kegiatan terdekat dari tanggal sekarang &amp; hari mendatang ({kalenderData?.totalKegiatan || 0} agenda terdata)
            </p>
          </div>

          <Link
            href="/kalender"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D7A6F] text-white hover:bg-[#155D54] text-xs font-semibold transition-colors shadow-xs no-print"
          >
            <span>Buka Kalender Kerja Lengkap</span>
            <ArrowRight className="w-4 h-4 text-[#C6A66B]" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AgendaSkeleton />
            <AgendaSkeleton />
            <AgendaSkeleton />
            <AgendaSkeleton />
          </div>
        ) : upcomingActivities.length === 0 ? (
          <div className="p-8 text-center text-[#5C6E66] text-xs bg-[#F7F5EF] rounded-lg border border-[#DCE5E0]">
            Belum ada agenda terdekat yang terdata di kalender.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingActivities.map((act, index) => (
              <Link
                key={index}
                href="/kalender"
                className="p-4 rounded-lg bg-[#F7F5EF]/60 border border-[#DCE5E0] flex flex-col justify-between hover:bg-white hover:border-[#1D7A6F] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 shadow-xs cursor-pointer group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F] select-none"
                title={`Buka agenda "${act.kegiatan}" di Kalender Kerja`}
                aria-label={`Buka agenda ${act.kegiatan} pada halaman Kalender Kerja`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#5C6E66] mb-2 gap-2">
                    {act.statusLabel ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${act.statusBadge}`}>
                        {act.statusLabel}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#1D7A6F] bg-[#E8F5F3] px-2 py-0.5 rounded border border-[#C8E3DC]">
                        {act.hari}
                      </span>
                    )}

                    {act.waktu && act.waktu !== '-' && (
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#DCE5E0] font-mono font-medium text-[#26332E]">
                        {act.waktu}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-bold text-[#1D7A6F] mb-1 line-clamp-1" title={act.tanggalLengkap}>
                    {act.tanggalLengkap || `${act.hari}, ${act.tglM} M / ${act.tglH} H`}
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-[#26332E] line-clamp-2 leading-snug group-hover:text-[#1D7A6F] transition-colors">
                    {act.kegiatan}
                  </h4>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[#DCE5E0] flex items-center justify-between text-[11px]">
                  <span className="text-[#5C6E66]">Koordinator:</span>
                  <span className="font-semibold text-[#1D7A6F] bg-white px-2 py-0.5 rounded border border-[#DCE5E0] group-hover:border-[#1D7A6F]/40 transition-colors">
                    {act.kordinator}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
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
      {/* 3. FILTER BULAN KEUANGAN INTERAKTIF (DISEMBUNYIKAN SAAT CETAK) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#DCE5E0] shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#1D7A6F]" />
            <span className="text-xs sm:text-sm font-bold text-[#26332E]">
              Pilih Periode Anggaran Keuangan:
            </span>
          </div>
          <span className="text-xs font-semibold text-[#1D7A6F] bg-[#E8F5F3] border border-[#C8E3DC] px-2.5 py-1 rounded">
            Aktif: {activeKeuangan.label}
          </span>
        </div>

        {/* Tab Tombol Pilihan Bulan */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedBulan('TOTAL')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
              selectedBulan === 'TOTAL'
                ? 'bg-[#1D7A6F] text-white border-[#1D7A6F] shadow-xs'
                : 'bg-[#F7F5EF] text-[#26332E] hover:bg-[#E8F5F3] border-[#DCE5E0]'
            }`}
          >
            Semua Periode (Total)
          </button>

          {keuanganData?.rekapitulasi?.map((item) => (
            <button
              key={item.bulan}
              onClick={() => setSelectedBulan(item.bulan)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                selectedBulan === item.bulan
                  ? 'bg-[#1D7A6F] text-white border-[#1D7A6F] shadow-xs'
                  : 'bg-white text-[#26332E] hover:bg-[#F7F5EF] border-[#DCE5E0]'
              }`}
            >
              {item.bulan}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. METRIK UTAMA DASHBOARD (LENGKAP & SELARAS DENGAN DATA ASLI) */}
      {/* ============================================================== */}
      
      {/* BARIS A: RINGKASAN KEUANGAN (RAB, LPJ & SALDO KAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print-avoid-break">
        
        {/* Kartu 1: RAB (Anggaran Masuk) */}
        <StatCard
          title="Angka Masuk (RAB)"
          value={formatRupiah(activeKeuangan.subsidi)}
          subvalue={activeKeuangan.label}
          icon={TrendingUp}
          iconBg="bg-[#E8F5F3]"
          iconColor="text-[#1D7A6F]"
          badgeText="Subsidi Masuk"
          badgeColor="bg-[#E8F5F3] text-[#1D7A6F] border-[#C8E3DC]"
          isLoading={loading}
          onClick={() => scrollToSection('section-rekap-keuangan')}
          actionHint="Lihat Rekap ↓"
          titleTooltip="Klik untuk menggulir ke Rekapitulasi Anggaran Bulanan"
          ariaLabel="Gulir ke tabel Rekapitulasi Anggaran Bulanan"
        />

        {/* Kartu 2: LPJ (Pengeluaran Realisasi) */}
        <StatCard
          title="Pengeluaran (LPJ)"
          value={formatRupiah(activeKeuangan.pengeluaran)}
          subvalue={`Realisasi: ${activeKeuangan.subsidi > 0 ? ((activeKeuangan.pengeluaran / activeKeuangan.subsidi) * 100).toFixed(1) : 0}%`}
          icon={TrendingDown}
          iconBg="bg-[#FAF0ED]"
          iconColor="text-[#8A2F1B]"
          badgeText="Pengeluaran"
          badgeColor="bg-[#FAF0ED] text-[#8A2F1B] border-[#E8BCB0]"
          isLoading={loading}
          onClick={() => scrollToSection('section-chart-keuangan')}
          actionHint="Lihat Diagram ↓"
          titleTooltip="Klik untuk menggulir ke Visualisasi Diagram Realisasi LPJ"
          ariaLabel="Gulir ke diagram proporsi realisasi pengeluaran LPJ"
        />

        {/* Kartu 3: Saldo Kas (Selaras dengan Halaman /keuangan) */}
        <StatCard
          title="Saldo Kas (Sisa Dana)"
          value={formatRupiah(activeKeuangan.saldo)}
          subvalue="Sisa anggaran kas periode ini"
          icon={Wallet}
          iconBg="bg-[#FAF3E6]"
          iconColor="text-[#8C6D23]"
          badgeText="Sisa Saldo"
          badgeColor="bg-[#FAF3E6] text-[#8C6D23] border-[#E8D5A7]"
          isLoading={loading}
          onClick={() => scrollToSection('section-rekap-keuangan')}
          actionHint="Lihat Rekap ↓"
          titleTooltip="Klik untuk menggulir ke Rekapitulasi Saldo Kas Bulanan"
          ariaLabel="Gulir ke rincian sisa saldo kas bulanan"
        />

      </div>

      {/* ============================================================== */}
      {/* 4.B VISUALISASI DIAGRAM BULAT PENGELUARAN KEUANGAN (LPJ)       */}
      {/* ============================================================== */}
      <div id="section-chart-keuangan" className="print-avoid-break scroll-mt-28">
        <KeuanganDonutChart
          rekapitulasi={keuanganData?.rekapitulasi || []}
          totalPengeluaran={keuanganData?.total?.pengeluaran || 0}
          isLoading={loading}
          selectedBulan={selectedBulan}
          onSelectBulan={setSelectedBulan}
        />
      </div>

      {/* BARIS B: RINGKASAN OPERASIONAL (SANTRI LBM, FORUM BAHSU & KALENDER) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print-avoid-break">
        
        {/* Kartu 4: Total Anggota LBM (Selaras dengan Halaman /anggota) */}
        <StatCard
          title="Total Anggota LBM"
          value={`${anggotaData?.total || 0} Santri`}
          subvalue="Terdaftar aktif di sistem MMD"
          icon={Users}
          badgeText="LBM MMD"
          badgeColor="bg-[#E8F5F3] text-[#1D7A6F] border-[#C8E3DC]"
          isLoading={loading}
          href="/anggota"
          actionHint="Buka Data →"
          titleTooltip="Klik untuk membuka Halaman Data Anggota LBM"
          ariaLabel="Buka halaman Data Anggota LBM"
        />

        {/* Kartu 5: Agenda Bahtsul Masail (Selaras dengan Halaman /bahsu) */}
        <StatCard
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

        {/* Kartu 6: Agenda Kalender Kerja (Selaras dengan Halaman /kalender) */}
        <StatCard
          title="Kalender Kerja MMD"
          value={`${kalenderData?.totalKegiatan || 0} Agenda`}
          subvalue={`${kalenderData?.totalWaka3 || 0} Agenda Khusus WAKA III`}
          icon={CalendarDays}
          iconBg="bg-[#EDF3F7]"
          iconColor="text-[#224A63]"
          badgeText="1 Tahun Ajaran"
          badgeColor="bg-[#EDF3F7] text-[#224A63] border-[#B9D1E0]"
          isLoading={loading}
          href="/kalender"
          actionHint="Buka Kalender →"
          titleTooltip="Klik untuk membuka Halaman Kalender Kerja MMD"
          ariaLabel="Buka halaman Kalender Kerja MMD"
        />

      </div>

      {/* ============================================================== */}
      {/* 5. DISTRIBUSI STATUS ANGGOTA + PIE CHART                       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 gap-6 print-avoid-break">
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
      {/* 6. DUA KOLOM: REKAP KEUANGAN & FORUM BAHTSUL MASAIL            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Kolom Kiri (6 Kolom): Rekapitulasi Anggaran Bulanan (Termasuk Saldo Kas) */}
        <div id="section-rekap-keuangan" className="lg:col-span-6 bg-white rounded-xl p-5 sm:p-6 border border-[#DCE5E0] shadow-xs flex flex-col justify-between print-avoid-break scroll-mt-28">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DCE5E0]">
              <div>
                <h3 className="font-bold text-lg text-[#26332E] font-serif flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#1D7A6F]" />
                  Rekapitulasi Anggaran Bulanan
                </h3>
                <p className="text-xs text-[#5C6E66] mt-0.5">
                  Klik baris bulan untuk melihat detail angka masuk, keluar &amp; saldo di atas
                </p>
              </div>

              <Link
                href="/keuangan"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D7A6F] hover:underline no-print"
              >
                Laporan Penuh
                <ArrowRight className="w-3.5 h-3.5 text-[#C6A66B]" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DCE5E0] text-[11px] font-bold text-[#5C6E66]">
                    <th className="py-2.5 px-3">Bulan / Periode</th>
                    <th className="py-2.5 px-3 text-right">RAB (Masuk)</th>
                    <th className="py-2.5 px-3 text-right">LPJ (Keluar)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-[#1D7A6F]">Saldo Kas</th>
                    <th className="py-2.5 px-3 text-center">Serap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5E0]/60">
                  {loading ? (
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3 px-3"><div className="h-4 bg-stone-200 rounded w-28"></div></td>
                        <td className="py-3 px-3 text-right"><div className="h-4 bg-stone-200 rounded w-20 ml-auto"></div></td>
                        <td className="py-3 px-3 text-right"><div className="h-4 bg-stone-200 rounded w-20 ml-auto"></div></td>
                        <td className="py-3 px-3 text-right"><div className="h-4 bg-stone-200 rounded w-20 ml-auto"></div></td>
                        <td className="py-3 px-3 text-center"><div className="h-4 bg-stone-200 rounded w-10 mx-auto"></div></td>
                      </tr>
                    ))
                  ) : keuanganData?.rekapitulasi?.map((item, idx) => {
                    const isSelected = selectedBulan === item.bulan;
                    const persen = item.subsidi > 0 ? ((item.pengeluaran / item.subsidi) * 100).toFixed(1) : 0;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedBulan(item.bulan)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#E8F5F3] font-semibold text-[#1D7A6F]'
                            : 'hover:bg-[#F7F5EF]/60'
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-[#26332E] flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#1D7A6F]"></span>}
                          <span>{item.bulan}</span>
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-[#26332E] font-medium font-mono">
                          {formatRupiah(item.subsidi)}
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-[#8A2F1B] font-medium font-mono">
                          {formatRupiah(item.pengeluaran)}
                        </td>
                        <td className="py-3 px-3 text-right text-xs font-bold text-[#1D7A6F] font-mono">
                          {formatRupiah(item.saldo)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EDF3F7] text-[#224A63] border border-[#B9D1E0]">
                            {persen}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Baris Total (Akumulasi Seluruh Periode) */}
                  {!loading && (
                    <tr
                      onClick={() => setSelectedBulan('TOTAL')}
                      className={`cursor-pointer border-t-2 border-[#1D7A6F] font-bold ${
                        selectedBulan === 'TOTAL' ? 'bg-[#E8F5F3]' : 'bg-[#F7F5EF] hover:bg-[#E8F5F3]/70'
                      }`}
                    >
                      <td className="py-3 px-3 text-[#1D7A6F] text-xs font-bold">TOTAL KESELURUHAN</td>
                      <td className="py-3 px-3 text-right text-xs text-[#26332E] font-mono">
                        {formatRupiah(keuanganData?.total?.subsidi || 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-[#8A2F1B] font-black font-mono">
                        {formatRupiah(keuanganData?.total?.pengeluaran || 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-[#1D7A6F] font-black font-mono">
                        {formatRupiah(keuanganData?.total?.saldo || 0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1D7A6F] text-white">
                          {keuanganData?.total?.subsidi > 0
                            ? ((keuanganData.total.pengeluaran / keuanganData.total.subsidi) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DCE5E0] flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#5C6E66] gap-1.5">
            <span className="flex items-center gap-1 text-[11px] text-[#5C6E66]">
              <Info className="w-3.5 h-3.5 text-[#1D7A6F] shrink-0" />
              Sisa saldo kas disetor kembali ke kas umum pondok.
            </span>
            <span className="font-semibold text-[#1D7A6F]">
              Saldo Aktif: <strong className="font-mono">{formatRupiah(activeKeuangan.saldo)}</strong>
            </span>
          </div>
        </div>

        {/* Kolom Kanan (6 Kolom): AGENDA BAHTSUL MASAIL DENGAN TAB FILTER */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 sm:p-6 border border-[#DCE5E0] shadow-xs flex flex-col justify-between print-avoid-break">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#DCE5E0]">
              <div>
                <h3 className="font-bold text-lg text-[#26332E] font-serif flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1D7A6F]" />
                  Jadwal &amp; Delegasi Bahtsul Masail
                </h3>
                <p className="text-xs text-[#5C6E66] mt-0.5">
                  Total {bahsuData?.totalAgenda || 0} forum se-Jawa Madura
                </p>
              </div>

              {/* Tab Filter Cepat Status Bahsu */}
              <div className="inline-flex items-center p-0.5 rounded bg-[#F7F5EF] border border-[#DCE5E0] text-[11px] font-semibold no-print">
                <button
                  onClick={() => setBahsuFilter('BELUM')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    bahsuFilter === 'BELUM'
                      ? 'bg-[#FAF3E6] text-[#8C6D23] font-bold border border-[#E8D5A7] shadow-xs'
                      : 'text-[#5C6E66] hover:text-[#26332E]'
                  }`}
                >
                  Belum ({bahsuData?.totalBelumBerangkat || 0})
                </button>
                <button
                  onClick={() => setBahsuFilter('SUDAH')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    bahsuFilter === 'SUDAH'
                      ? 'bg-[#E8F5F3] text-[#1D7A6F] font-bold border border-[#C8E3DC] shadow-xs'
                      : 'text-[#5C6E66] hover:text-[#26332E]'
                  }`}
                >
                  Sudah ({bahsuData?.totalSudahBerangkat || 0})
                </button>
                <button
                  onClick={() => setBahsuFilter('ALL')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    bahsuFilter === 'ALL'
                      ? 'bg-[#1D7A6F] text-white font-bold shadow-xs'
                      : 'text-[#5C6E66] hover:text-[#26332E]'
                  }`}
                >
                  Semua ({bahsuData?.totalAgenda || 0})
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {displayedBahsuEvents.length > 0 ? (
                displayedBahsuEvents.slice(0, 5).map((item, idx) => (
                  <Link
                    key={item.id || idx}
                    href="/bahsu"
                    className="p-3 rounded-lg bg-white border border-[#DCE5E0] flex items-start justify-between gap-3 hover:bg-[#F7F5EF]/80 hover:border-[#1D7A6F] hover:shadow-xs transition-all duration-150 cursor-pointer group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F] select-none"
                    title={`Buka detail agenda forum "${item.acara}" di Halaman Bahtsul Masail`}
                    aria-label={`Buka detail agenda forum ${item.acara}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[#1D7A6F] bg-[#E8F5F3] border border-[#C8E3DC] px-1.5 py-0.2 rounded">
                          #{item.no || idx + 1}
                        </span>
                        <span className="text-xs text-[#5C6E66] flex items-center gap-1 font-medium font-mono">
                          <Clock className="w-3 h-3 text-[#C6A66B]" />
                          {item.tanggal}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#26332E] line-clamp-1 group-hover:text-[#1D7A6F] transition-colors">
                        {item.acara}
                      </h4>
                      {item.delegasi && item.delegasi.length > 0 && (
                        <p className="text-[11px] text-[#5C6E66] mt-0.5 line-clamp-1">
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
                <div className="p-8 text-center text-[#5C6E66] text-xs">
                  Tidak ada agenda forum dalam kategori ini.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DCE5E0] flex items-center justify-between text-xs text-[#5C6E66] no-print">
            <span>Menampilkan {Math.min(5, displayedBahsuEvents.length)} dari {displayedBahsuEvents.length} forum</span>
            <Link href="/bahsu" className="font-semibold text-[#1D7A6F] hover:underline flex items-center gap-1">
              Buka Seluruh Jadwal Bahsu <ArrowRight className="w-3 h-3 text-[#C6A66B]" />
            </Link>
          </div>
        </div>

      </div>

      {/* Tanda Tangan Resmi Pengesahan Laporan */}
      <PrintSignatures leftRole="Kepala MMD Darussalamah" rightRole="WAKA III MMD Darussalamah" />

    </div>
  );
}

