'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DATA_LINKS } from '@/lib/dataLinks';
import { getAnggotaData } from '@/lib/fetchCSV';
import AnggotaTable from '@/components/AnggotaTable';
import AdminButton from '@/components/AdminButton';
import { Users, RefreshCw, AlertCircle, ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function AnggotaPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnggota = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await getAnggotaData(DATA_LINKS.anggota.csvUrl);
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Gagal memuat data anggota dari Google Sheets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnggota(true);

    const timer = setInterval(() => fetchAnggota(false), 25000);
    const onFocus = () => fetchAnggota(false);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchAnggota]);

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
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            title="Cetak Laporan Data Anggota atau Simpan sebagai PDF"
          >
            <Printer className="w-4 h-4 text-[#1D7A6F]" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={() => fetchAnggota(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#1D7A6F] hover:bg-[#F7F5EF] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#1D7A6F] ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menyinkronkan...' : 'Perbarui'}</span>
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
            <button onClick={() => fetchAnggota(true)} className="underline text-xs mt-1 cursor-pointer">Coba Muat Ulang</button>
          </div>
        </div>
      )}

      {/* Konten Utama */}
      {loading ? (
        <div className="bg-white rounded-xl p-16 text-center text-[#5C6E66] border border-[#DCE5E0]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1D7A6F] mb-3" />
          <p className="text-sm font-medium">Mengambil data anggota langsung dari Google Sheets...</p>
        </div>
      ) : (
        <AnggotaTable
          anggota={data?.anggota || []}
          editUrl={DATA_LINKS.anggota.editUrl}
          onRefresh={() => fetchAnggota(false)}
        />
      )}

    </div>
  );
}
