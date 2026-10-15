'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import NotificationButton from '@/components/NotificationButton';
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
} from 'lucide-react';

export default function DashboardPage() {
  const [anggotaData, setAnggotaData] = useState(null);
  const [keuanganData, setKeuanganData] = useState(null);
  const [bahsuData, setBahsuData] = useState(null);
  const [kalenderData, setKalenderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

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
   * 2. Auto-refresh otomatis setiap 25 detik
   * 3. Auto-refresh instan saat pengguna kembali ke tab ini dari Google Sheets
   */
  useEffect(() => {
    loadData(true);

    // Polling interval 25 detik
    const timer = setInterval(() => {
      loadData(false);
    }, 25000);

    // Deteksi saat pengguna kembali membuka tab ini di browser
    const onFocus = () => loadData(false);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData(false);
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
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
          statusBadge = 'bg-emerald-600 text-white';
        } else if (diffDays === 1) {
          statusLabel = 'Besok';
          statusBadge = 'bg-amber-500 text-white';
        } else if (diffDays === 2) {
          statusLabel = 'Lusa';
          statusBadge = 'bg-[#2A9D8F] text-white';
        } else if (diffDays > 2) {
          statusLabel = `${diffDays} hari lagi`;
          statusBadge = 'bg-[#E8F5F3] text-[#1D7A6F] border border-[#2A9D8F]/30';
        } else {
          statusLabel = `${Math.abs(diffDays)} hari lalu`;
          statusBadge = 'bg-gray-100 text-gray-600';
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

  return (
    <div className="space-y-8">
      
      {/* ============================================================== */}
      {/* 1. BANNER SAMBUTAN, STATUS LIVE REAL-TIME & SINKRONISASI         */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#2A9D8F]/15 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-[#E8F5F3] rounded-full blur-2xl opacity-60 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F5F3] text-[#1D7A6F] text-xs font-semibold mb-3 border border-[#2A9D8F]/20">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Informasi WAKA III Pondok Pesantren Darussalam Sumbersari
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2D3436] tracking-tight">
              Portal LBM, Kalender Kerja &amp; Keuangan
            </h1>
            <p className="text-sm sm:text-base text-[#636E72] mt-2 leading-relaxed">
              Memantau perkembangan {anggotaData?.total || 25} santri LBM, kalender kerja tahunan madrasah, {bahsuData?.totalAgenda || 34} agenda delegasi Bahtsul Masail, dan rekapitulasi keuangan RAB &amp; LPJ secara langsung dan otomatis dari Google Sheets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={loading || isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#2A9D8F]/30 bg-white text-[#1D7A6F] hover:bg-[#E8F5F3] text-sm font-semibold transition-all duration-150 disabled:opacity-50 shadow-xs cursor-pointer"
              title="Perbarui data langsung dari Google Sheets sekarang"
            >
              <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin text-[#2A9D8F]' : ''}`} />
              <span>{loading || isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
            </button>
            <AdminButton editUrl={DATA_LINKS.anggota.editUrl} title="Edit di Sheets" />
          </div>
        </div>

        {/* Status Sinkronisasi Real-Time */}
        <div className="mt-5 pt-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-[#636E72]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-800">
              Live Real-Time Auto-Sync Aktif
            </span>
            <span className="text-gray-400">•</span>
            <span>Update otomatis tiap 25 detik &amp; saat tab aktif</span>
          </div>

          {lastRefreshed && (
            <div className="flex items-center gap-1.5 text-[#636E72]">
              <Clock className="w-3.5 h-3.5 text-[#2A9D8F]" />
              <span>Terakhir diperbarui: pukul <strong className="text-[#2D3436]">{lastRefreshed} WIB</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. KARTU JAM ISTIWA' (WIS) WILAYAH PARE                        */}
      {/* ============================================================== */}
      <JamIstiwaCard />

      {/* ============================================================== */}
      {/* 2.5 PUSAT NOTIFIKASI SISTEM (ONESIGNAL WEB PUSH)              */}
      {/* ============================================================== */}
      <NotificationButton variant="card" />

      {/* ============================================================== */}
      {/* 3. HIGHLIGHT KALENDER KERJA MMD (AGENDA TERDEKAT DARI HARI INI) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#2A9D8F]/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F3] text-[#1D7A6F] text-xs font-semibold mb-1">
              <CalendarDays className="w-3.5 h-3.5" />
              Agenda Terdekat Madrasah
            </div>
            <h3 className="font-extrabold text-xl text-[#2D3436]">
              Sorotan Agenda Kalender Kerja MMD
            </h3>
            <p className="text-xs sm:text-sm text-[#636E72] mt-0.5">
              Kegiatan terdekat dari tanggal sekarang &amp; hari mendatang ({kalenderData?.totalKegiatan || 0} agenda terdata)
            </p>
          </div>

          <Link
            href="/kalender"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2A9D8F] text-white hover:bg-[#1D7A6F] text-sm font-semibold transition-colors shadow-xs"
          >
            <span>Buka Kalender Kerja Lengkap</span>
            <ArrowRight className="w-4 h-4" />
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
          <div className="p-8 text-center text-gray-400 text-xs bg-[#FFFCF5] rounded-2xl border border-gray-100">
            Belum ada agenda terdekat yang terdata.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingActivities.map((act, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#2A9D8F]/15 flex flex-col justify-between hover:bg-[#FDF6E3] hover:border-[#2A9D8F]/40 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#636E72] mb-2 gap-2">
                    {act.statusLabel ? (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${act.statusBadge}`}>
                        {act.statusLabel}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#1D7A6F] bg-[#E8F5F3] px-2 py-0.5 rounded-full">
                        {act.hari}
                      </span>
                    )}

                    {act.waktu && act.waktu !== '-' && (
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-gray-200 font-medium">
                        {act.waktu}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-bold text-[#1D7A6F] mb-1 line-clamp-1" title={act.tanggalLengkap}>
                    {act.tanggalLengkap || `${act.hari}, ${act.tglM} M / ${act.tglH} H`}
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-[#2D3436] line-clamp-2 leading-snug">
                    {act.kegiatan}
                  </h4>
                </div>

                <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="text-[#636E72]">Koordinator:</span>
                  <span className="font-semibold text-[#1D7A6F] bg-white px-2 py-0.5 rounded-md border border-[#2A9D8F]/20">
                    {act.kordinator}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Error Jika Ada Masalah Fetch */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Gagal Mengambil Data Google Sheets</h4>
            <p className="text-xs mt-1 text-rose-700">{error}</p>
            <button
              onClick={() => loadData(true)}
              className="mt-2 text-xs font-semibold text-rose-800 underline hover:no-underline"
            >
              Coba lagi sekarang
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. FILTER BULAN KEUANGAN INTERAKTIF                            */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#2A9D8F]/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#2A9D8F]" />
            <span className="text-xs sm:text-sm font-bold text-[#2D3436]">
              Pilih Periode Anggaran Keuangan:
            </span>
          </div>
          <span className="text-xs font-semibold text-[#1D7A6F] bg-[#E8F5F3] px-2.5 py-1 rounded-lg">
            Aktif: {activeKeuangan.label}
          </span>
        </div>

        {/* Tab Tombol Pilihan Bulan */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedBulan('TOTAL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedBulan === 'TOTAL'
                ? 'bg-[#2A9D8F] text-white shadow-xs'
                : 'bg-[#FDF6E3] text-[#2D3436] hover:bg-[#E8F5F3] border border-[#2A9D8F]/20'
            }`}
          >
            Semua Periode (Total)
          </button>

          {keuanganData?.rekapitulasi?.map((item) => (
            <button
              key={item.bulan}
              onClick={() => setSelectedBulan(item.bulan)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedBulan === item.bulan
                  ? 'bg-[#2A9D8F] text-white shadow-xs'
                  : 'bg-white text-[#2D3436] hover:bg-[#E8F5F3] border border-gray-200'
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Kartu 1: RAB (Anggaran Masuk) */}
        <StatCard
          title="Angka Masuk (RAB)"
          value={formatRupiah(activeKeuangan.subsidi)}
          subvalue={activeKeuangan.label}
          icon={TrendingUp}
          iconBg="bg-[#E8F5F3]"
          iconColor="text-[#2A9D8F]"
          badgeText="Subsidi Masuk"
          badgeColor="bg-[#E8F5F3] text-[#1D7A6F]"
          isLoading={loading}
        />

        {/* Kartu 2: LPJ (Pengeluaran Realisasi) */}
        <StatCard
          title="Pengeluaran (LPJ)"
          value={formatRupiah(activeKeuangan.pengeluaran)}
          subvalue={`Realisasi: ${activeKeuangan.subsidi > 0 ? ((activeKeuangan.pengeluaran / activeKeuangan.subsidi) * 100).toFixed(1) : 0}%`}
          icon={TrendingDown}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          badgeText="Pengeluaran"
          badgeColor="bg-rose-50 text-rose-700"
          isLoading={loading}
        />

        {/* Kartu 3: Saldo Kas (Selaras dengan Halaman /keuangan) */}
        <StatCard
          title="Saldo Kas (Sisa Dana)"
          value={formatRupiah(activeKeuangan.saldo)}
          subvalue="Sisa anggaran kas periode ini"
          icon={Wallet}
          iconBg="bg-[#E8F5F3]"
          iconColor="text-[#1D7A6F]"
          badgeText="Saldo Kas"
          badgeColor="bg-[#E8F5F3] text-[#1D7A6F]"
          isLoading={loading}
        />

      </div>

      {/* ============================================================== */}
      {/* 4.B VISUALISASI DIAGRAM BULAT PENGELUARAN KEUANGAN (LPJ)       */}
      {/* ============================================================== */}
      <KeuanganDonutChart
        rekapitulasi={keuanganData?.rekapitulasi || []}
        totalPengeluaran={keuanganData?.total?.pengeluaran || 0}
        isLoading={loading}
        selectedBulan={selectedBulan}
        onSelectBulan={setSelectedBulan}
      />

      {/* BARIS B: RINGKASAN OPERASIONAL (SANTRI LBM, FORUM BAHSU & KALENDER) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Kartu 4: Total Anggota LBM (Selaras dengan Halaman /anggota) */}
        <StatCard
          title="Total Anggota LBM"
          value={`${anggotaData?.total || 0} Santri`}
          subvalue="Terdaftar aktif di sistem MMD"
          icon={Users}
          badgeText="LBM MMD"
          badgeColor="bg-[#E8F5F3] text-[#1D7A6F]"
          isLoading={loading}
        />

        {/* Kartu 5: Agenda Bahtsul Masail (Selaras dengan Halaman /bahsu) */}
        <StatCard
          title="Forum Bahtsul Masail"
          value={`${bahsuData?.totalAgenda || 0} Forum`}
          subvalue={`${bahsuData?.totalSudahBerangkat || 0} Sudah • ${bahsuData?.totalBelumBerangkat || 0} Belum • ${bahsuData?.totalIzin || 0} Izin`}
          icon={BookOpen}
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
          badgeText="Agenda 2026"
          badgeColor="bg-amber-50 text-amber-800"
          isLoading={loading}
        />

        {/* Kartu 6: Agenda Kalender Kerja (Selaras dengan Halaman /kalender) */}
        <StatCard
          title="Kalender Kerja MMD"
          value={`${kalenderData?.totalKegiatan || 0} Agenda`}
          subvalue={`${kalenderData?.totalWaka3 || 0} Agenda Khusus WAKA III`}
          icon={CalendarDays}
          iconBg="bg-teal-50"
          iconColor="text-teal-700"
          badgeText="1 Tahun Ajaran"
          badgeColor="bg-teal-50 text-teal-800"
          isLoading={loading}
        />

      </div>

      {/* ============================================================== */}
      {/* 5. DISTRIBUSI STATUS ANGGOTA + PIE CHART                       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-[#2A9D8F]/15 animate-pulse flex flex-col md:flex-row items-center justify-around gap-6 min-h-[280px]">
            <div className="w-44 h-44 rounded-full bg-gray-200/80 animate-pulse"></div>
            <div className="space-y-3 w-full max-w-sm">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/5"></div>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Kolom Kiri (6 Kolom): Rekapitulasi Anggaran Bulanan (Termasuk Saldo Kas) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 shadow-xs border border-[#2A9D8F]/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#2D3436] flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#2A9D8F]" />
                  Rekapitulasi Anggaran Bulanan
                </h3>
                <p className="text-xs text-[#636E72] mt-0.5">
                  Klik baris bulan untuk melihat detail angka masuk, keluar &amp; saldo di atas
                </p>
              </div>

              <Link
                href="/keuangan"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D7A6F] hover:text-[#2A9D8F] hover:underline"
              >
                Laporan Penuh
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-[#636E72]">
                    <th className="py-2.5 px-3">Bulan / Periode</th>
                    <th className="py-2.5 px-3 text-right">RAB (Masuk)</th>
                    <th className="py-2.5 px-3 text-right">LPJ (Keluar)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-[#1D7A6F]">Saldo Kas</th>
                    <th className="py-2.5 px-3 text-center">Penyerapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3 px-3"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                        <td className="py-3 px-3 text-right"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                        <td className="py-3 px-3 text-right"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                        <td className="py-3 px-3 text-right"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                        <td className="py-3 px-3 text-center"><div className="h-4 bg-gray-200 rounded w-10 mx-auto"></div></td>
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
                            : 'hover:bg-[#FFFCF5]'
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-[#2D3436] flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#2A9D8F]"></span>}
                          <span>{item.bulan}</span>
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-[#2D3436] font-medium">
                          {formatRupiah(item.subsidi)}
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-rose-600 font-medium">
                          {formatRupiah(item.pengeluaran)}
                        </td>
                        <td className="py-3 px-3 text-right text-xs font-bold text-[#1D7A6F]">
                          {formatRupiah(item.saldo)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
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
                      className={`cursor-pointer border-t-2 border-[#2A9D8F] font-bold ${
                        selectedBulan === 'TOTAL' ? 'bg-[#E8F5F3]' : 'bg-gray-50 hover:bg-[#FFFCF5]'
                      }`}
                    >
                      <td className="py-3 px-3 text-[#1D7A6F]">TOTAL KESELURUHAN</td>
                      <td className="py-3 px-3 text-right text-xs text-[#2D3436]">
                        {formatRupiah(keuanganData?.total?.subsidi || 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-rose-700 font-black">
                        {formatRupiah(keuanganData?.total?.pengeluaran || 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-[#1D7A6F] font-black">
                        {formatRupiah(keuanganData?.total?.saldo || 0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#2A9D8F] text-white">
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

          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#636E72] gap-1.5">
            <span className="flex items-center gap-1 text-[11px] text-[#636E72]">
              <Info className="w-3.5 h-3.5 text-[#2A9D8F] shrink-0" />
              Sisa saldo kas disetor kembali ke kas umum pondok.
            </span>
            <span className="font-semibold text-[#1D7A6F]">
              Saldo Aktif: {formatRupiah(activeKeuangan.saldo)}
            </span>
          </div>
        </div>

        {/* Kolom Kanan (6 Kolom): AGENDA BAHTSUL MASAIL DENGAN TAB FILTER */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 shadow-xs border border-[#2A9D8F]/15 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#2D3436] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#2A9D8F]" />
                  Jadwal &amp; Delegasi Bahtsul Masail
                </h3>
                <p className="text-xs text-[#636E72] mt-0.5">
                  Total {bahsuData?.totalAgenda || 0} forum se-Jawa Madura
                </p>
              </div>

              {/* Tab Filter Cepat Status Bahsu */}
              <div className="inline-flex items-center p-1 rounded-xl bg-gray-100 text-xs font-semibold">
                <button
                  onClick={() => setBahsuFilter('BELUM')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    bahsuFilter === 'BELUM'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Belum ({bahsuData?.totalBelumBerangkat || 0})
                </button>
                <button
                  onClick={() => setBahsuFilter('SUDAH')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    bahsuFilter === 'SUDAH'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Sudah ({bahsuData?.totalSudahBerangkat || 0})
                </button>
                <button
                  onClick={() => setBahsuFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    bahsuFilter === 'ALL'
                      ? 'bg-[#2A9D8F] text-white shadow-xs'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Semua ({bahsuData?.totalAgenda || 0})
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {displayedBahsuEvents.length > 0 ? (
                displayedBahsuEvents.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl bg-[#FFFCF5] border border-amber-200/70 flex items-start justify-between gap-3 hover:bg-[#FDF6E3] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          #{item.no || idx + 1}
                        </span>
                        <span className="text-xs text-[#636E72] flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-[#2A9D8F]" />
                          {item.tanggal}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#2D3436] line-clamp-1">
                        {item.acara}
                      </h4>
                      {item.delegasi && item.delegasi.length > 0 && (
                        <p className="text-[11px] text-[#636E72] mt-1 line-clamp-1">
                          Delegasi: {item.delegasi.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {item.statusKeberangkatan === 'BELUM_BERANGKAT' && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Hourglass className="w-3 h-3" />
                          Belum Berangkat
                        </span>
                      )}
                      {item.statusKeberangkatan === 'SUDAH_BERANGKAT' && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Sudah Berangkat
                        </span>
                      )}
                      {item.statusKeberangkatan === 'IZIN' && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Izin / Batal
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs">
                  Tidak ada forum dalam filter ini.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#636E72]">
            <span>Menampilkan {Math.min(5, displayedBahsuEvents.length)} dari {displayedBahsuEvents.length} forum</span>
            <Link href="/bahsu" className="font-semibold text-[#1D7A6F] hover:underline flex items-center gap-1">
              Buka Seluruh Jadwal Bahsu <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
