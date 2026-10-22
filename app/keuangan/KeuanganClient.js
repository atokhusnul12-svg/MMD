'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Wallet,
  TrendingDown,
  TrendingUp,
  Printer,
  RefreshCw,
  Clock,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Info,
  FileText,
} from 'lucide-react';
import { DATA_LINKS } from '@/lib/dataLinks';
import { useAuth } from '@/lib/auth';
import { formatRupiah, getKeuanganData } from '@/lib/fetchCSV';
import KeuanganDonutChart from '@/components/KeuanganDonutChart';
import KeuanganDetailModal from '@/components/KeuanganDetailModal';
import { smartScrollTo } from '@/lib/scrollTo';
import { useBackgroundSync } from '@/lib/useBackgroundSync';
import CountUp from '@/components/motion/CountUp';

function AdminButton({ editUrl, title }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return (
    <a
      href={editUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ECD8A5] bg-[#FAF3E6] text-[#8C6D23] hover:bg-[#F5E8CB] text-xs font-semibold transition-colors shadow-2xs shrink-0"
      title={title}
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>{title}</span>
      <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
    </a>
  );
}

export default function KeuanganClient({ initialData, serverError = null }) {
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData || null);
  const [error, setError] = useState(serverError || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBulan, setSelectedBulan] = useState('TOTAL');
  const [hoveredBulan, setHoveredBulan] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const lastFetchRef = useRef(0);

  const handleOpenDetail = useCallback((itemToOpen) => {
    setSelectedDetailItem(itemToOpen);
  }, []);

  // Sinkronisasi data latar belakang (Client-Side)
  const fetchKeuangan = useCallback(async (showIndicator = false) => {
    try {
      if (showIndicator) setIsRefreshing(true);
      setError(null);
      const res = await getKeuanganData(DATA_LINKS.keuangan.csvUrl);
      setData(res);
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error('Fetch Keuangan client error:', err);
      if (!data) {
        setError(err?.message || 'Gagal memuat data keuangan dari Google Sheets.');
      }
    } finally {
      if (showIndicator) setIsRefreshing(false);
    }
  }, [data]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
    });
    fetchKeuangan(true);
  }, [router, fetchKeuangan]);

  useBackgroundSync(fetchKeuangan, { lastFetchRef });

  const spinning = isRefreshing || isPending;

  // Perhitungan dinamis keuangan berdasarkan bulan / periode yang dipilih
  const activeKeuangan = useMemo(() => {
    if (!data?.rekapitulasi?.length) {
      return { subsidi: 0, pengeluaran: 0, saldo: 0, label: 'Memuat...', serap: 0 };
    }

    if (selectedBulan === 'TOTAL') {
      const sub = data.total?.subsidi ?? data.rekapitulasi.reduce((acc, c) => acc + (c.subsidi || 0), 0);
      const peng = data.total?.pengeluaran ?? data.rekapitulasi.reduce((acc, c) => acc + (c.pengeluaran || 0), 0);
      const sal = data.total?.saldo ?? (sub - peng);
      const serap = sub > 0 ? ((peng / sub) * 100).toFixed(1) : 0;
      return {
        subsidi: sub,
        pengeluaran: peng,
        saldo: sal,
        serap,
        label: `Akumulasi Seluruh (${data.rekapitulasi.length} Periode)`,
      };
    }

    const item = data.rekapitulasi.find((r) => r.bulan === selectedBulan);
    if (item) {
      const serap = item.subsidi > 0 ? ((item.pengeluaran / item.subsidi) * 100).toFixed(1) : 0;
      return {
        subsidi: item.subsidi || 0,
        pengeluaran: item.pengeluaran || 0,
        saldo: item.saldo || 0,
        serap,
        label: item.bulan,
      };
    }

    return { subsidi: 0, pengeluaran: 0, saldo: 0, label: selectedBulan, serap: 0 };
  }, [data, selectedBulan]);

  return (
    <div className="space-y-6">
      {/* Header Halaman Keuangan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#5C6E66] mb-1">
            <Link href="/" className="hover:text-[#1D7A6F] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 text-[#C6A66B]" /> HOME
            </Link>
            <span>/</span>
            <span className="text-[#1D7A6F] font-bold">Keuangan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332E] tracking-tight font-serif flex items-center gap-2">
            <span>Ringkasan Keuangan RAB &amp; LPJ</span>
            <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] hidden sm:inline-flex">
              MMD Darussalamah
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E66] mt-1">
            Rekapitulasi anggaran subsidi masuk (RAB), realisasi belanja per periode (LPJ), dan transparansi saldo kas madrasah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F] text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
            title="Cetak Laporan Keuangan atau Simpan sebagai PDF"
          >
            <Printer className="w-4 h-4 text-[#1D7A6F]" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={spinning}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#1D7A6F] hover:bg-[#F7F5EF] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            title="Segarkan data langsung dari Google Sheets"
          >
            <RefreshCw className={`w-4 h-4 text-[#1D7A6F] ${spinning ? 'animate-spin' : ''}`} />
            <span>{spinning ? 'Menyinkronkan...' : 'Perbarui'}</span>
          </button>
          <AdminButton editUrl={DATA_LINKS.keuangan.editUrl} title="Edit di Sheets" />
        </div>
      </div>

      {/* Pesan Kesalahan / Error */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 no-print">
          <HelpCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Gagal Menyinkronkan Data Keuangan</p>
            <p className="text-rose-700/90 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. PILIHAN PERIODE ANGGARAN KEUANGAN                           */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#DCE5E0] shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#1D7A6F]" />
            <span className="text-xs sm:text-sm font-bold text-[#26332E]">
              Pilih Periode Anggaran Keuangan:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1D7A6F] bg-[#E8F5F3] border border-[#C8E3DC] px-2.5 py-1 rounded">
              Aktif: {activeKeuangan.label}
            </span>
            <button
              type="button"
              onClick={() => {
                const currentItem =
                  selectedBulan === 'TOTAL'
                    ? {
                        bulan: 'TOTAL',
                        subsidi: data?.total?.subsidi || 0,
                        pengeluaran: data?.total?.pengeluaran || 0,
                        saldo: data?.total?.saldo || 0,
                        keterangan: data?.total?.keterangan || 'Akumulasi Seluruh Periode',
                        serap: activeKeuangan.serap,
                      }
                    : data?.rekapitulasi?.find((r) => r.bulan === selectedBulan) || {
                        bulan: selectedBulan,
                        subsidi: activeKeuangan.subsidi,
                        pengeluaran: activeKeuangan.pengeluaran,
                        saldo: activeKeuangan.saldo,
                        keterangan: '',
                        serap: activeKeuangan.serap,
                      };
                handleOpenDetail(currentItem);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1D7A6F] hover:bg-[#155A52] text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F]"
              title={`Buka rincian lengkap untuk ${activeKeuangan.label}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lihat Rincian</span>
            </button>
          </div>
        </div>

        {/* Tab Tombol Pilihan Bulan */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedBulan('TOTAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
              selectedBulan === 'TOTAL'
                ? 'bg-[#1D7A6F] text-white border-[#1D7A6F] shadow-xs'
                : 'bg-[#F7F5EF] text-[#26332E] hover:bg-[#E8F5F3] border-[#DCE5E0]'
            }`}
          >
            Semua Periode (Total)
          </button>

          {data?.rekapitulasi?.map((item) => (
            <button
              key={item.bulan}
              onClick={() => setSelectedBulan(item.bulan)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
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
      {/* 2. TIGA KARTU METRIK UTAMA (RAB, LPJ, SALDO KAS)               */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print-avoid-break">
        {/* Kartu 1: RAB (Anggaran Masuk) */}
        <motion.div
          role="button"
          tabIndex={0}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.45, delay: 0 * 0.08, ease: [0.16, 1, 0.3, 1] }
          }
          whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          onClick={() => smartScrollTo('section-rekap-keuangan')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              smartScrollTo('section-rekap-keuangan');
            }
          }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCE5E0] shadow-xs flex flex-col justify-between hover:border-[#1D7A6F] hover:shadow-md transition-shadow duration-200 cursor-pointer group select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E66]">
              Angka Masuk (RAB)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F5F3] text-[#1D7A6F] flex items-center justify-center shrink-0 border border-[#C8E3DC] group-hover:scale-108 transition-transform duration-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-[#26332E] font-serif tracking-tight truncate">
              <CountUp
                target={activeKeuangan.subsidi}
                prefix="Rp "
                duration={1000}
              />
            </div>
            <div className="flex items-center justify-between gap-1 text-[11px] text-[#5C6E66] mt-1">
              <span className="truncate">{activeKeuangan.label}</span>
              <span className="text-[#1D7A6F] font-semibold shrink-0">Lihat Rekap ↓</span>
            </div>
          </div>
        </motion.div>

        {/* Kartu 2: LPJ (Pengeluaran Realisasi) */}
        <motion.div
          role="button"
          tabIndex={0}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.45, delay: 1 * 0.08, ease: [0.16, 1, 0.3, 1] }
          }
          whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          onClick={() => smartScrollTo('section-chart-keuangan')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              smartScrollTo('section-chart-keuangan');
            }
          }}
          className="p-4 sm:p-5 rounded-2xl bg-[#FAF0ED]/60 border border-[#E8BCB0] shadow-xs flex flex-col justify-between hover:border-[#8A2F1B] hover:shadow-md transition-shadow duration-200 cursor-pointer group select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#8A2F1B]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A2F1B]">
              Pengeluaran (LPJ)
            </span>
            <div className="w-8 h-8 rounded-lg bg-white text-[#8A2F1B] flex items-center justify-center shrink-0 border border-[#E8BCB0] group-hover:scale-108 transition-transform duration-200">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-[#8A2F1B] font-serif tracking-tight truncate">
              <CountUp
                target={activeKeuangan.pengeluaran}
                prefix="Rp "
                duration={1000}
              />
            </div>
            <div className="flex items-center justify-between gap-1 text-[11px] text-[#8A2F1B]/90 mt-1">
              <span>
                Realisasi: <strong>
                  <CountUp
                    target={typeof activeKeuangan.serap === 'number' ? activeKeuangan.serap : parseFloat(activeKeuangan.serap) || 0}
                    decimals={1}
                    suffix="%"
                    duration={800}
                  />
                </strong>
              </span>
              <span className="font-semibold shrink-0">Lihat Diagram ↓</span>
            </div>
          </div>
        </motion.div>

        {/* Kartu 3: Saldo Kas */}
        <motion.div
          role="button"
          tabIndex={0}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.45, delay: 2 * 0.08, ease: [0.16, 1, 0.3, 1] }
          }
          whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          onClick={() => smartScrollTo('section-rekap-keuangan')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              smartScrollTo('section-rekap-keuangan');
            }
          }}
          className="p-4 sm:p-5 rounded-2xl bg-[#FAF3E6]/60 border border-[#ECD8A5] shadow-xs flex flex-col justify-between hover:border-[#8C6D23] hover:shadow-md transition-shadow duration-200 cursor-pointer group select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#8C6D23]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D23]">
              Saldo Kas (Sisa Dana)
            </span>
            <div className="w-8 h-8 rounded-lg bg-white text-[#8C6D23] flex items-center justify-center shrink-0 border border-[#ECD8A5] group-hover:scale-108 transition-transform duration-200">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-[#8C6D23] font-serif tracking-tight truncate">
              <CountUp
                target={activeKeuangan.saldo}
                prefix="Rp "
                duration={1000}
              />
            </div>
            <div className="flex items-center justify-between gap-1 text-[11px] text-[#8C6D23]/90 mt-1">
              <span className="truncate">Sisa anggaran kas periode ini</span>
              <span className="font-semibold shrink-0">Lihat Rekap ↓</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ============================================================== */}
      {/* 3. VISUALISASI DIAGRAM BULAT PENGELUARAN KEUANGAN (LPJ)        */}
      {/* ============================================================== */}
      <div id="section-chart-keuangan" className="print-avoid-break scroll-mt-28">
        <KeuanganDonutChart
          rekapitulasi={data?.rekapitulasi || []}
          totalPengeluaran={data?.total?.pengeluaran || 0}
          isLoading={spinning}
          selectedBulan={selectedBulan}
          hoveredBulan={hoveredBulan}
          onSelectBulan={setSelectedBulan}
          onHoverBulan={setHoveredBulan}
        />
      </div>

      {/* ============================================================== */}
      {/* 4. TABEL REKAPITULASI ANGGARAN BULANAN                         */}
      {/* ============================================================== */}
      <div id="section-rekap-keuangan" className="bg-white rounded-2xl border border-[#DCE5E0] shadow-xs flex flex-col justify-between print-avoid-break scroll-mt-28 overflow-hidden">
        <div>
          <div className="p-5 sm:p-6 border-b border-[#DCE5E0] bg-[#FAF6EF]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg text-[#26332E] font-serif flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#1D7A6F]" />
                <span>Rekapitulasi Anggaran Bulanan</span>
              </h2>
              <p className="text-xs text-[#5C6E66] mt-0.5">
                Klik baris bulan atau klik tombol &ldquo;Lihat Rincian&rdquo; untuk memeriksa rincian lengkap sesuai data asli
              </p>
            </div>

            <div className="text-[11px] text-[#5C6E66] flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-[#C6A66B]" />
              <span>Update otomatis dari Google Sheets</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#DCE5E0] text-[11px] font-bold text-[#5C6E66] bg-[#FAF6EF]/30 uppercase tracking-wider">
                  <th className="py-3 px-4">Bulan / Periode</th>
                  <th className="py-3 px-4 text-right">RAB (Masuk)</th>
                  <th className="py-3 px-4 text-right">LPJ (Keluar)</th>
                  <th className="py-3 px-4 text-right font-bold text-[#1D7A6F]">Saldo Kas</th>
                  <th className="py-3 px-4 text-center">Serap</th>
                  <th className="py-3 px-4 text-center">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5E0]/60">
                {data?.rekapitulasi?.map((item, idx) => {
                  const isSelected = selectedBulan === item.bulan;
                  const isHovered = hoveredBulan === item.bulan;
                  const highlight = isSelected || isHovered;
                  const persen = item.subsidi > 0 ? ((item.pengeluaran / item.subsidi) * 100).toFixed(1) : 0;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedBulan(item.bulan)}
                      onMouseEnter={() => setHoveredBulan(item.bulan)}
                      onMouseLeave={() => setHoveredBulan(null)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        highlight
                          ? 'bg-[#E8F5F3] font-semibold text-[#1D7A6F]'
                          : 'hover:bg-[#FAF6EF]/60'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#26332E] flex items-center gap-2">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#1D7A6F]"></span>}
                        <span>{item.bulan}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-[#26332E] font-medium font-mono">
                        {formatRupiah(item.subsidi)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-[#8A2F1B] font-medium font-mono">
                        {formatRupiah(item.pengeluaran)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-bold text-[#1D7A6F] font-mono">
                        {formatRupiah(item.saldo)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EDF3F7] text-[#224A63] border border-[#B9D1E0]">
                          {persen}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8F5F3] hover:bg-[#1D7A6F] text-[#1D7A6F] hover:text-white border border-[#C8E3DC] hover:border-[#1D7A6F] text-xs font-semibold transition-colors duration-150 shadow-2xs cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F]"
                          title={`Lihat Rincian Lengkap ${item.bulan}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Lihat Rincian</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Baris Total (Akumulasi Seluruh Periode) */}
                <tr
                  onClick={() => setSelectedBulan('TOTAL')}
                  className={`cursor-pointer border-t-2 border-[#1D7A6F] font-bold ${
                    selectedBulan === 'TOTAL' ? 'bg-[#E8F5F3]' : 'bg-[#FAF6EF] hover:bg-[#E8F5F3]/70'
                  }`}
                >
                  <td className="py-3.5 px-4 text-[#1D7A6F] text-xs font-bold">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs text-[#26332E] font-mono">
                    {formatRupiah(data?.total?.subsidi || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs text-[#8A2F1B] font-black font-mono">
                    {formatRupiah(data?.total?.pengeluaran || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs text-[#1D7A6F] font-black font-mono">
                    {formatRupiah(data?.total?.saldo || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1D7A6F] text-white">
                      {data?.total?.subsidi > 0
                        ? ((data.total.pengeluaran / data.total.subsidi) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail({
                          bulan: 'TOTAL',
                          subsidi: data?.total?.subsidi || 0,
                          pengeluaran: data?.total?.pengeluaran || 0,
                          saldo: data?.total?.saldo || 0,
                          keterangan: data?.total?.keterangan || 'Akumulasi Seluruh Periode',
                          serap: data?.total?.subsidi > 0
                            ? ((data.total.pengeluaran / data.total.subsidi) * 100).toFixed(1)
                            : 0,
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D7A6F] hover:bg-[#155A52] text-white border border-[#1D7A6F] text-xs font-semibold transition-colors duration-150 shadow-2xs cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F]"
                      title="Lihat Rincian Lengkap Akumulasi Seluruh Periode"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Lihat Rincian</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-[#DCE5E0] bg-[#FAF6EF]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#5C6E66] gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-[#5C6E66]">
            <Info className="w-3.5 h-3.5 text-[#1D7A6F] shrink-0" />
            <span>Sisa saldo kas disetor kembali ke kas umum pondok.</span>
          </span>
          <span className="font-semibold text-[#1D7A6F]">
            Saldo Aktif: <strong className="font-mono text-sm">{formatRupiah(activeKeuangan.saldo)}</strong>
          </span>
        </div>
      </div>

      {/* Modal Dialog Rincian Keuangan Lengkap */}
      <KeuanganDetailModal
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        item={selectedDetailItem}
        allRekap={data?.rekapitulasi || []}
        totalData={data?.total}
        catatanBerikutnya={data?.catatanBerikutnya || []}
      />
    </div>
  );
}
