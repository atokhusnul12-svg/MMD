'use client';

import React, { useState, useCallback, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DATA_LINKS } from '@/lib/dataLinks';
import { getKeuanganData } from '@/lib/fetchCSV';
import KeuanganTable from '@/components/KeuanganTable';
import AdminButton from '@/components/AdminButton';
import { Wallet, RefreshCw, AlertCircle, ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

const SYNC_INTERVAL_MS = 180_000;
const REFOCUS_COOLDOWN_MS = 60_000;

export default function KeuanganClient({ initialData, serverError = null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initialData || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(serverError || null);
  const lastFetchRef = useRef(Date.now());

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
        setError(err?.message || 'Gagal memuat rekapitulasi keuangan dari Google Sheets.');
      }
    } finally {
      if (showIndicator) setIsRefreshing(false);
    }
  }, [data]);

  // Handler tombol "Perbarui" manual
  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
    });
    fetchKeuangan(true);
  }, [router, fetchKeuangan]);

  // Background auto-refresh timer & window focus listener
  useEffect(() => {
    const timer = setInterval(() => fetchKeuangan(false), SYNC_INTERVAL_MS);

    const throttledRefetch = () => {
      if (Date.now() - lastFetchRef.current >= REFOCUS_COOLDOWN_MS) fetchKeuangan(false);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') throttledRefetch();
    };

    window.addEventListener('focus', throttledRefetch);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', throttledRefetch);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchKeuangan]);

  const spinning = isRefreshing || isPending;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#5C6E66] mb-1">
            <Link href="/" className="hover:text-[#1D7A6F] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 text-[#C6A66B]" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#1D7A6F] font-bold">Keuangan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332E] tracking-tight font-serif">
            Ringkasan Keuangan RAB &amp; LPJ
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E66] mt-1">
            Rekapitulasi anggaran subsidi, realisasi pengeluaran, dan saldo kas MMD Darussalamah
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => { if (typeof window !== 'undefined') window.print(); }}
            disabled={!data || !data?.rekapitulasi || data?.rekapitulasi?.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
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

      {/* Error state */}
      {error && (
        <div className="bg-[#FAF0ED] border border-[#F1D3CC] text-[#8A2F1B] rounded-2xl p-4 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#8A2F1B] mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="underline text-xs mt-1 cursor-pointer font-medium hover:text-[#5C1F12]"
            >
              Coba Muat Ulang
            </button>
          </div>
        </div>
      )}

      {/* Konten Utama */}
      <KeuanganTable
        keuanganData={data}
        editUrl={DATA_LINKS.keuangan.editUrl}
      />
    </div>
  );
}
