'use client';

import React, { useEffect, useState } from 'react';
import { DATA_LINKS } from '@/lib/dataLinks';
import { getKalenderData } from '@/lib/fetchCSV';
import KalenderView from '@/components/KalenderView';
import AdminButton from '@/components/AdminButton';
import { Calendar, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function KalenderPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKalender = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await getKalenderData(DATA_LINKS.kalender.csvUrl);
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Gagal memuat Kalender Kerja dari Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKalender(true);

    const timer = setInterval(() => fetchKalender(false), 25000);
    const onFocus = () => fetchKalender(false);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#5C6E66] mb-1">
            <Link href="/" className="hover:text-[#1D7A6F] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 text-[#C6A66B]" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#1D7A6F] font-bold">Kalender Kerja</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332E] tracking-tight font-serif">
            Kalender Kerja MMD Darussalamah
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E66] mt-1">
            Jadwal kegiatan madrasah, musyawarah, takror, ujian, serta rutinitas LBM tahun ajaran 1447-1448 H / 2026-2027 M
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchKalender}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#1D7A6F] hover:bg-[#F7F5EF] text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#1D7A6F] ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menyinkronkan...' : 'Perbarui'}</span>
          </button>
          <AdminButton editUrl={DATA_LINKS.kalender.editUrl} title="Edit di Sheets" />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-[#FAF0ED] border border-[#E8BCB0] text-[#8A2F1B] rounded-xl p-4 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#8A2F1B] mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            <button onClick={fetchKalender} className="underline text-xs mt-1 cursor-pointer">Coba Muat Ulang</button>
          </div>
        </div>
      )}

      {/* Konten Utama */}
      {loading ? (
        <div className="bg-white rounded-xl p-16 text-center text-[#5C6E66] border border-[#DCE5E0]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1D7A6F] mb-3" />
          <p className="text-sm font-medium">Memuat Kalender Kerja langsung dari Google Sheets...</p>
        </div>
      ) : (
        <KalenderView
          bulanList={data?.bulanList || []}
          allActivities={data?.allActivities || []}
          totalKegiatan={data?.totalKegiatan || 0}
          totalWaka3={data?.totalWaka3 || 0}
          kordinatorList={data?.kordinatorList || []}
          editUrl={DATA_LINKS.kalender.editUrl}
        />
      )}

    </div>
  );
}

