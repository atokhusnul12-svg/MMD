'use client';

import React, { useEffect, useState } from 'react';
import { DATA_LINKS } from '@/lib/dataLinks';
import { getAnggotaData } from '@/lib/fetchCSV';
import AnggotaTable from '@/components/AnggotaTable';
import AdminButton from '@/components/AdminButton';
import { Users, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AnggotaPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnggota = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnggotaData(DATA_LINKS.anggota.csvUrl);
      setData(res);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data anggota dari Google Sheets. Pastikan spreadsheet telah dipublikasikan sebagai CSV.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnggota();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#636E72] mb-1">
            <Link href="/" className="hover:text-[#2A9D8F] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#1D7A6F] font-semibold">Anggota LBM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D3436] tracking-tight">
            Data Anggota LBM
          </h1>
          <p className="text-xs sm:text-sm text-[#636E72] mt-1">
            Daftar seluruh santri Madrasah Islamiyah Darussalamah yang tergabung dalam LBM
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnggota}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2A9D8F]/30 bg-white text-[#1D7A6F] hover:bg-[#E8F5F3] text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2A9D8F]' : ''}`} />
            <span>{loading ? 'Menyinkronkan...' : 'Perbarui'}</span>
          </button>
          <AdminButton editUrl={DATA_LINKS.anggota.editUrl} title="Edit di Google Sheets" />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            <button onClick={fetchAnggota} className="underline text-xs mt-1">Coba Muat Ulang</button>
          </div>
        </div>
      )}

      {/* Konten Utama */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center text-gray-400 border border-[#2A9D8F]/15">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#2A9D8F] mb-3" />
          <p className="text-sm font-medium">Mengambil data anggota langsung dari Google Sheets...</p>
        </div>
      ) : (
        <AnggotaTable
          anggota={data?.anggota || []}
          editUrl={DATA_LINKS.anggota.editUrl}
        />
      )}

    </div>
  );
}
