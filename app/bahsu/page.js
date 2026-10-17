'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DATA_LINKS } from '@/lib/dataLinks';
import { getBahsuData, getAnggotaData } from '@/lib/fetchCSV';
import BahsuTable from '@/components/BahsuTable';
import AdminButton from '@/components/AdminButton';
import { Calendar, RefreshCw, AlertCircle, ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function BahsuPage() {
  const [data, setData] = useState(null);
  const [anggotaList, setAnggotaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBahsu = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Ambil jadwal pemberangkatan bahsu sekaligus data profil anggota LBM
      const [bahsuRes, anggotaRes] = await Promise.all([
        getBahsuData(DATA_LINKS.bahsu.csvUrl),
        getAnggotaData(DATA_LINKS.anggota.csvUrl).catch((err) => {
          console.warn('Gagal memuat profil anggota pendamping:', err);
          return { anggota: [] };
        }),
      ]);

      setData(bahsuRes);
      if (anggotaRes?.anggota) {
        setAnggotaList(anggotaRes.anggota);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Gagal memuat jadwal & delegasi Bahtsul Masail dari Google Sheets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBahsu(true);

    const timer = setInterval(() => fetchBahsu(false), 25000);
    const onFocus = () => fetchBahsu(false);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchBahsu]);

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
            <span className="text-[#1D7A6F] font-bold">Pemberangkatan Bahsu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332E] tracking-tight font-serif">
            Daftar Pemberangkatan &amp; Delegasi Bahtsul Masail
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E66] mt-1">
            Jadwal kegiatan forum Bahtsul Masail se-Jawa Madura, lokasi pesantren, dan utusan delegasi santri LBM Darussalamah
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => window.print()}
            disabled={loading || !!error}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            title="Cetak Laporan Bahtsul Masail atau Simpan sebagai PDF"
          >
            <Printer className="w-4 h-4 text-[#1D7A6F]" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={() => fetchBahsu(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#1D7A6F] hover:bg-[#F7F5EF] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#1D7A6F] ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menyinkronkan...' : 'Perbarui'}</span>
          </button>
          <AdminButton editUrl={DATA_LINKS.bahsu.editUrl} title="Edit di Sheets" />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-[#FAF0ED] border border-[#E8BCB0] text-[#8A2F1B] rounded-xl p-4 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#8A2F1B] mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            <button onClick={() => fetchBahsu(true)} className="underline text-xs mt-1 cursor-pointer">Coba Muat Ulang</button>
          </div>
        </div>
      )}

      {/* Konten Utama */}
      {loading ? (
        <div className="bg-white rounded-xl p-16 text-center text-[#5C6E66] border border-[#DCE5E0]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1D7A6F] mb-3" />
          <p className="text-sm font-medium">Memuat jadwal &amp; delegasi Bahtsul Masail langsung dari Google Sheets...</p>
        </div>
      ) : (
        <BahsuTable
          events={data?.events || []}
          title={data?.title}
          editUrl={DATA_LINKS.bahsu.editUrl}
          anggotaList={anggotaList}
          onRefresh={() => fetchBahsu(false)}
        />
      )}

    </div>
  );
}
