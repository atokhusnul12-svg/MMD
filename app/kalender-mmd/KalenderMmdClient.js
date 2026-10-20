'use client';

import React, { useState, useCallback, useRef, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DATA_LINKS } from '@/lib/dataLinks';
import { getKalenderData } from '@/lib/fetchCSV';
import KalenderView from '@/components/KalenderView';
import AdminButton from '@/components/AdminButton';
import {
  CalendarDays,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useBackgroundSync } from '@/lib/useBackgroundSync';

export default function KalenderMmdClient({ initialData, serverError = null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initialData || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(serverError || null);
  const lastFetchRef = useRef(0);

  // Sinkronisasi data latar belakang (Client-Side)
  const fetchKalender = useCallback(async (showIndicator = false) => {
    try {
      if (showIndicator) setIsRefreshing(true);
      setError(null);
      const res = await getKalenderData(DATA_LINKS.kalender.csvUrl);
      setData(res);
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error('Fetch Kalender client error:', err);
      if (!data) {
        setError(err?.message || 'Gagal memuat Kalender Kerja dari Google Sheets.');
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
    fetchKalender(true);
  }, [router, fetchKalender]);

  useBackgroundSync(fetchKalender, { lastFetchRef });

  const spinning = isRefreshing || isPending;

  // Filter daftar agenda Kalender Kerja yang terdekat dengan hari ini / besok (Sorotan Kalender)
  const upcomingActivities = useMemo(() => {
    if (!data?.allActivities?.length) return [];

    const MONTH_MAP = {
      januari: 0,
      februari: 1,
      maret: 2,
      april: 3,
      mei: 4,
      juni: 5,
      juli: 6,
      agustus: 7,
      september: 8,
      oktober: 9,
      november: 10,
      desember: 11,
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

    const withDates = data.allActivities.map((a) => {
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
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header Halaman Kalender MMD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#5C6E66] mb-1">
            <Link href="/" className="hover:text-[#1D7A6F] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 text-[#C6A66B]" /> HOME
            </Link>
            <span>/</span>
            <span className="text-[#1D7A6F] font-bold">Kalender MMD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332E] tracking-tight font-serif flex items-center gap-2">
            <span>Kalender Kerja MMD</span>
            <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] hidden sm:inline-flex">
              Tahun Ajaran 1447-1448 H / 2026-2027 M
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E66] mt-1">
            Jadwal kegiatan madrasah, musyawarah santri, takror, ujian, serta rutinitas LBM Majlis Musyawaroh Darussalam.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F] text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
            title="Cetak Jadwal Kalender Kerja"
          >
            <Printer className="w-4 h-4 text-[#1D7A6F]" />
            <span>Cetak Kalender</span>
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
          <AdminButton editUrl={DATA_LINKS.kalender.editUrl} title="Edit di Sheets" />
        </div>
      </div>

      {/* Banner Error jika ada */}
      {error && (
        <div className="bg-[#FAF0ED] border border-[#E8BCB0] text-[#8A2F1B] rounded-xl p-4 flex items-start gap-3 text-sm no-print">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#8A2F1B] mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Gagal Mengambil Data Kalender</h4>
            <p className="text-xs mt-1 text-[#8A2F1B]">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="mt-2 text-xs font-semibold text-[#8A2F1B] underline hover:no-underline cursor-pointer"
            >
              Coba lagi sekarang
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. SOROTAN AGENDA KALENDER KERJA MMD (AGENDA TERDEKAT)         */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#DCE5E0] shadow-xs print-avoid-break">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#DCE5E0]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F5F3] text-[#1D7A6F] text-[11px] font-bold border border-[#C8E3DC] mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C6A66B]" />
              <span>Agenda Terdekat Madrasah</span>
            </div>
            <h2 className="font-extrabold text-xl text-[#26332E] font-serif">
              Sorotan Agenda Kalender Kerja MMD
            </h2>
            <p className="text-xs sm:text-sm text-[#5C6E66] mt-0.5">
              Kegiatan terdekat dari tanggal sekarang &amp; hari mendatang ({data?.totalKegiatan || 0} agenda terdata)
            </p>
          </div>
        </div>

        {upcomingActivities.length === 0 ? (
          <div className="p-8 text-center text-[#5C6E66] text-xs bg-[#F7F5EF] rounded-xl border border-[#DCE5E0]">
            Belum ada agenda terdekat yang terdata di kalender.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingActivities.map((act, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-[#FAF6EF]/60 border border-[#DCE5E0] flex flex-col justify-between hover:bg-white hover:border-[#1D7A6F] hover:shadow-md transition-all duration-200 shadow-2xs"
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

                  <h3 className="font-bold text-xs sm:text-sm text-[#26332E] line-clamp-2 leading-snug">
                    {act.kegiatan}
                  </h3>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[#DCE5E0] flex items-center justify-between text-[11px]">
                  <span className="text-[#5C6E66]">Koordinator:</span>
                  <span className="font-semibold text-[#1D7A6F] bg-white px-2 py-0.5 rounded border border-[#DCE5E0]">
                    {act.kordinator}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. JADWAL KALENDER KERJA LENGKAP DENGAN TAB BULAN & PENCARIAN   */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-[#DCE5E0] shadow-xs overflow-hidden">
        <KalenderView
          bulanList={data?.bulanList || []}
          allActivities={data?.allActivities || []}
          totalKegiatan={data?.totalKegiatan || 0}
          totalWaka3={data?.totalWaka3 || 0}
          kordinatorList={data?.kordinatorList || []}
          editUrl={DATA_LINKS.kalender.editUrl}
        />
      </div>
    </div>
  );
}
