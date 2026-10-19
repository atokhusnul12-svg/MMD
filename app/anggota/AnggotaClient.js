'use client';

import React, { useState, useCallback, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DATA_LINKS } from '@/lib/dataLinks';
import { getAnggotaData } from '@/lib/fetchCSV';
import AnggotaTable from '@/components/AnggotaTable';
import AdminButton from '@/components/AdminButton';
import { Users, RefreshCw, AlertCircle, ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

const SYNC_INTERVAL_MS = 180_000;
const REFOCUS_COOLDOWN_MS = 60_000;

export default function AnggotaClient({ initialData, serverError = null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initialData || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(serverError || null);
  const lastFetchRef = useRef(Date.now());

  // Sinkronisasi data latar belakang (Client-Side) jika ada perubahan di Google Sheets
  const fetchAnggota = useCallback(async (showIndicator = false) => {
    try {
      if (showIndicator) setIsRefreshing(true);
      setError(null);
      const res = await getAnggotaData(DATA_LINKS.anggota.csvUrl);
      setData(res);
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error('Fetch Anggota client error:', err);
      if (!data) {
        setError(err?.message || 'Gagal memuat data anggota dari Google Sheets.');
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
    fetchAnggota(true);
  }, [router, fetchAnggota]);

  // Background auto-refresh timer & window focus listener
  useEffect(() => {
    const timer = setInterval(() => fetchAnggota(false), SYNC_INTERVAL_MS);

    const throttledRefetch = () => {
      if (Date.now() - lastFetchRef.current >= REFOCUS_COOLDOWN_MS) fetchAnggota(false);
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
  }, [fetchAnggota]);

  const spinning = isRefreshing || isPending;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#5C6E66] mb-1">
            <Link href="/" className="hover:text-[#1D7A6F] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 text-[#C6A66B]" /> HOME
            </Link>
            <span>/</span>
            <span className="text-[#1D7A6F] font-bold">Anggota LBM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332E] tracking-tight font-serif">
            Data Anggota LBM
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E66] mt-1">
            Daftar santri Madrasah Islamiyah Darussalamah dalam Lembaga Bahtsul Masail (LBM)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 no-print">
          <button
            onClick={() => { if (typeof window !== 'undefined') window.print(); }}
            disabled={!data || data?.anggota?.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            title="Cetak Laporan Data Anggota atau Simpan sebagai PDF"
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
          <AdminButton editUrl={DATA_LINKS.anggota.editUrl} title="Edit di Sheets" />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-[#FAF0ED] border border-[#E8BCB0] text-[#8A2F1B] rounded-xl p-4 flex items-start gap-3 text-sm">
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
      <AnggotaTable
        anggota={data?.anggota || []}
        editUrl={DATA_LINKS.anggota.editUrl}
        onRefresh={() => fetchAnggota(false)}
      />
    </div>
  );
}
