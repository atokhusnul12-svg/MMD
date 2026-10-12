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
import AdminButton from '@/components/AdminButton';
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
} from 'lucide-react';

export default function DashboardPage() {
  const [anggotaData, setAnggotaData] = useState(null);
  const [keuanganData, setKeuanganData] = useState(null);
  const [bahsuData, setBahsuData] = useState(null);
  const [kalenderData, setKalenderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // State untuk filter bulan keuangan interaktif di dashboard
  const [selectedBulan, setSelectedBulan] = useState('TOTAL');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resAnggota, resKeuangan, resBahsu, resKalender] = await Promise.all([
        getAnggotaData(DATA_LINKS.anggota.csvUrl),
        getKeuanganData(DATA_LINKS.keuangan.csvUrl),
        getBahsuData(DATA_LINKS.bahsu.csvUrl),
        getKalenderData(DATA_LINKS.kalender.csvUrl),
      ]);

      setAnggotaData(resAnggota);
      setKeuanganData(resKeuangan);
      setBahsuData(resBahsu);
      setKalenderData(resKalender);
      setLastRefreshed(new Date().toLocaleTimeString('id-ID'));
    } catch (err) {
      console.error('Gagal mengambil data CSV:', err);
      setError('Terjadi kendala saat mengambil data langsung dari Google Sheets. Pastikan koneksi internet aktif dan link spreadsheet telah dipublikasikan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Perhitungan dinamis angka masuk dan pengeluaran berdasarkan bulan yang diklik (TANPA SALDO DI DASHBOARD)
  const activeKeuangan = useMemo(() => {
    if (!keuanganData) return { subsidi: 0, pengeluaran: 0, label: 'Memuat...' };

    if (selectedBulan === 'TOTAL') {
      return {
        subsidi: keuanganData.total?.subsidi || 0,
        pengeluaran: keuanganData.total?.pengeluaran || 0,
        label: `Akumulasi Seluruh (${keuanganData.rekapitulasi?.length || 0} Periode)`,
      };
    }

    const item = keuanganData.rekapitulasi?.find(r => r.bulan === selectedBulan);
    if (item) {
      return {
        subsidi: item.subsidi,
        pengeluaran: item.pengeluaran,
        label: item.bulan,
      };
    }

    return {
      subsidi: keuanganData.total?.subsidi || 0,
      pengeluaran: keuanganData.total?.pengeluaran || 0,
      label: 'Total Keseluruhan',
    };
  }, [keuanganData, selectedBulan]);

  // Filter daftar forum Bahtsul Masail: TAMPILKAN HANYA YANG BELUM BERANGKAT
  const eventsBelumBerangkat = useMemo(() => {
    if (!bahsuData?.events) return [];
    return bahsuData.events.filter(e => e.statusKeberangkatan === 'BELUM_BERANGKAT');
  }, [bahsuData]);

  return (
    <div className="space-y-8">
      
      {/* Banner Sambutan & Refresh Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#2A9D8F]/15 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-[#E8F5F3] rounded-full blur-2xl opacity-60 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F5F3] text-[#1D7A6F] text-xs font-semibold mb-3 border border-[#2A9D8F]/20">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Informasi WAKA III Pondok Pesantren Darussalam Sumbersari
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2D3436] tracking-tight">
              Portal LBM, Kalender Kerja & Keuangan
            </h1>
            <p className="text-sm sm:text-base text-[#636E72] mt-2 leading-relaxed">
              Memantau perkembangan 25 santri LBM, kalender kerja tahunan madrasah, jadwal delegasi Bahtsul Masail yang belum berangkat, dan rekapitulasi keuangan RAB & LPJ secara otomatis dari Google Sheets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#2A9D8F]/30 bg-white text-[#1D7A6F] hover:bg-[#E8F5F3] text-sm font-semibold transition-all duration-150 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2A9D8F]' : ''}`} />
              <span>{loading ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
            </button>
            <AdminButton editUrl={DATA_LINKS.anggota.editUrl} title="Edit di Sheets" />
          </div>
        </div>

        {lastRefreshed && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-[#636E72]">
            <Clock className="w-3.5 h-3.5 text-[#2A9D8F]" />
            <span>Terakhir diperbarui: pukul {lastRefreshed} WIB</span>
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
              onClick={loadData}
              className="mt-2 text-xs font-semibold text-rose-800 underline hover:no-underline"
            >
              Coba lagi sekarang
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FILTER BULAN KEUANGAN INTERAKTIF DI DASHBOARD                   */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#2A9D8F]/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#2A9D8F]" />
            <span className="text-xs sm:text-sm font-bold text-[#2D3436]">
              Pilih Bulan untuk Menampilkan Angka Masuk & Pengeluaran:
            </span>
          </div>
          <span className="text-xs font-semibold text-[#1D7A6F] bg-[#E8F5F3] px-2.5 py-1 rounded-lg">
            Aktif: {activeKeuangan.label}
          </span>
        </div>

        {/* Tab Tombol Pilihan Bulan (Klik untuk ubah angka di dashboard) */}
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
      {/* 4 KARTU STATISTIK UTAMA (TANPA SALDO DI DASHBOARD)             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Kartu 1: Angka Masuk Secara Global (Subsidi / RAB) */}
        <StatCard
          title="Angka Masuk (RAB)"
          value={loading ? '...' : formatRupiah(activeKeuangan.subsidi)}
          subvalue={activeKeuangan.label}
          icon={TrendingUp}
          iconBg="bg-[#E8F5F3]"
          iconColor="text-[#2A9D8F]"
          badgeText="Subsidi Masuk"
          badgeColor="bg-[#E8F5F3] text-[#1D7A6F]"
        />

        {/* Kartu 2: Pengeluaran (LPJ / Realisasi Belanja) */}
        <StatCard
          title="Pengeluaran (LPJ)"
          value={loading ? '...' : formatRupiah(activeKeuangan.pengeluaran)}
          subvalue="Realisasi belanja periode ini"
          icon={TrendingDown}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          badgeText="Pengeluaran"
          badgeColor="bg-rose-50 text-rose-700"
        />

        {/* Kartu 3: Total Anggota LBM */}
        <StatCard
          title="Total Anggota LBM"
          value={loading ? '...' : `${anggotaData?.total || 0} Santri`}
          subvalue="Terdaftar aktif di sistem"
          icon={Users}
          badgeText="LBM MMD"
          badgeColor="bg-[#E8F5F3] text-[#1D7A6F]"
        />

        {/* Kartu 4: Agenda Bahsu yang Belum Berangkat */}
        <StatCard
          title="Bahsu Belum Berangkat"
          value={loading ? '...' : `${eventsBelumBerangkat.length} Agenda`}
          subvalue={`Dari total ${bahsuData?.totalAgenda || 0} forum`}
          icon={Hourglass}
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
          badgeText="Menunggu Berangkat"
          badgeColor="bg-amber-50 text-amber-800"
        />

      </div>

      {/* DISTRIBUSI STATUS ANGGOTA + PIE CHART */}
      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-[#2A9D8F]/15">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#2A9D8F] mb-3" />
            <p className="text-sm font-medium">Memuat data anggota dari Google Sheets...</p>
          </div>
        ) : (
          <PieChart
            statusCounts={anggotaData?.statusCounts || {}}
            total={anggotaData?.total || 0}
          />
        )}
      </div>

      {/* 2 KOLOM: RINGKASAN KEUANGAN (TANPA SALDO) & DAFTAR BAHASU BELUM BERANGKAT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Kolom Kiri (6 Kolom): Rekap Keuangan Per Periode (Hanya Angka Masuk & Pengeluaran) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 shadow-xs border border-[#2A9D8F]/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#2D3436] flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#2A9D8F]" />
                  Rekapitulasi Anggaran Bulanan
                </h3>
                <p className="text-xs text-[#636E72] mt-0.5">
                  Klik baris bulan untuk melihat detail angka masuk & keluar di atas
                </p>
              </div>

              <Link
                href="/keuangan"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D7A6F] hover:text-[#2A9D8F] hover:underline"
              >
                Laporan Lengkap & Saldo
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-[#636E72]">
                    <th className="py-2.5 px-3">Bulan</th>
                    <th className="py-2.5 px-3 text-right">Subsidi (Masuk)</th>
                    <th className="py-2.5 px-3 text-right">Pengeluaran</th>
                    <th className="py-2.5 px-3 text-center">Penyerapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {keuanganData?.rekapitulasi?.map((item, idx) => {
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
                        <td className="py-3 px-3 text-center">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                            {persen}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Baris Total */}
                  <tr
                    onClick={() => setSelectedBulan('TOTAL')}
                    className={`cursor-pointer border-t-2 border-[#2A9D8F] font-bold ${
                      selectedBulan === 'TOTAL' ? 'bg-[#E8F5F3]' : 'bg-gray-50 hover:bg-[#FFFCF5]'
                    }`}
                  >
                    <td className="py-3 px-3 text-[#1D7A6F]">TOTAL SELURUH BULAN</td>
                    <td className="py-3 px-3 text-right text-xs text-[#2D3436]">
                      {formatRupiah(keuanganData?.total?.subsidi || 0)}
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-rose-700 font-black">
                      {formatRupiah(keuanganData?.total?.pengeluaran || 0)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#2A9D8F] text-white">
                        {keuanganData?.total?.subsidi > 0
                          ? ((keuanganData.total.pengeluaran / keuanganData.total.subsidi) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#636E72] gap-1.5">
            <span className="flex items-center gap-1 text-[11px] text-[#636E72]">
              <Info className="w-3.5 h-3.5 text-[#2A9D8F] shrink-0" />
              Sisa saldo akhir bulan selalu dikembalikan ke pondok (saldo nol).
            </span>
            <span className="font-semibold text-[#1D7A6F]">
              Pengeluaran Aktif: {formatRupiah(activeKeuangan.pengeluaran)}
            </span>
          </div>
        </div>

        {/* Kolom Kanan (6 Kolom): AGENDA BAHTSUL MASAIL YANG BELUM BERANGKAT SAJA */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 shadow-xs border border-[#2A9D8F]/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#2D3436] flex items-center gap-2">
                  <Hourglass className="w-5 h-5 text-amber-600" />
                  Jadwal Bahsu yang Belum Berangkat
                </h3>
                <p className="text-xs text-[#636E72] mt-0.5">
                  Menampilkan agenda forum Bahtsul Masail yang akan datang ({eventsBelumBerangkat.length} forum)
                </p>
              </div>

              <Link
                href="/bahsu"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D7A6F] hover:text-[#2A9D8F] hover:underline"
              >
                Lihat Semua
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {eventsBelumBerangkat.length > 0 ? (
                eventsBelumBerangkat.slice(0, 5).map((item, idx) => (
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
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Hourglass className="w-3 h-3" />
                        Belum Berangkat
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs">
                  Semua forum yang terjadwal telah diberangkatkan.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#636E72]">
            <span>{eventsBelumBerangkat.length} agenda menunggu keberangkatan</span>
            <Link href="/bahsu" className="font-semibold text-[#1D7A6F] hover:underline flex items-center gap-1">
              Buka Seluruh Jadwal <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

      {/* SECTION TAMBAHAN: HIGHLIGHT KALENDER KERJA MMD */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#2A9D8F]/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F3] text-[#1D7A6F] text-xs font-semibold mb-1">
              <CalendarDays className="w-3.5 h-3.5" />
              Jadwal Tahunan Madrasah
            </div>
            <h3 className="font-extrabold text-xl text-[#2D3436]">
              Sorotan Agenda Kalender Kerja MMD
            </h3>
            <p className="text-xs sm:text-sm text-[#636E72] mt-0.5">
              Kegiatan madrasah, musyawarah, takror, dan program LBM ({kalenderData?.totalKegiatan || 0} agenda)
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kalenderData?.allActivities?.slice(0, 4).map((act, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#2A9D8F]/15 flex flex-col justify-between hover:bg-[#FDF6E3] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#636E72] mb-2">
                  <span className="font-bold text-[#1D7A6F]">{act.hari}, {act.tglM} M / {act.tglH} H</span>
                  {act.waktu && act.waktu !== '-' && (
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-gray-200">
                      {act.waktu}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-[#2D3436] line-clamp-2">
                  {act.kegiatan}
                </h4>
              </div>

              <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className="text-[#636E72]">Koordinator:</span>
                <span className="font-semibold text-[#1D7A6F]">{act.kordinator}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
