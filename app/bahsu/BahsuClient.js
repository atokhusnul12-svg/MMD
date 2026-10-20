'use client';

import React, { useState, useCallback, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DATA_LINKS } from '@/lib/dataLinks';
import { getBahsuData, getAnggotaData, parseStatusKeberangkatan } from '@/lib/fetchCSV';
import BahsuTable from '@/components/BahsuTable';
import AdminButton from '@/components/AdminButton';
import { Calendar, RefreshCw, AlertCircle, ArrowLeft, Printer, Plus } from 'lucide-react';
import Link from 'next/link';
import { useBackgroundSync } from '@/lib/useBackgroundSync';

export default function BahsuClient({ initialData, initialAnggotaList = [], serverError = null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initialData || null);
  const [anggotaList, setAnggotaList] = useState(initialAnggotaList || []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(serverError || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const dataRef = useRef(data);
  const lastFetchRef = useRef(0);
  const recentlySavedRef = useRef(new Map());

  // Sinkronisasi data saat server component melakukan revalidasi ISR atau router.refresh()
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialAnggotaList && initialAnggotaList.length > 0) {
      setAnggotaList(initialAnggotaList);
    }
  }, [initialAnggotaList]);

  useEffect(() => {
    if (serverError !== undefined) {
      setError(serverError);
    }
  }, [serverError]);

  // Sinkronisasi data latar belakang (Client-Side) jika ada update baru di Google Sheets
  const fetchBahsu = useCallback(async (showIndicator = false) => {
    try {
      if (showIndicator) setIsRefreshing(true);
      setError(null);

      const [bahsuRes, anggotaRes] = await Promise.all([
        getBahsuData(DATA_LINKS.bahsu.csvUrl),
        getAnggotaData(DATA_LINKS.anggota.csvUrl).catch((err) => {
          console.warn('Gagal memuat profil anggota pendamping:', err);
          return { anggota: [] };
        }),
      ]);

      // Lindungi perubahan terbaru dari penimpaan cache Google Sheets yang belum terpropagasi
      const now = Date.now();
      const updatedEvents = [...(bahsuRes.events || [])];
      let hasPreservedChanges = false;

      recentlySavedRef.current.forEach((saved, key) => {
        // Hapus entri yang sudah lebih dari 30 detik
        if (now - saved.time > 30000) {
          recentlySavedRef.current.delete(key);
          return;
        }

        const idx = updatedEvents.findIndex(
          (e) => (saved.event.no && String(e.no) === String(saved.event.no)) ||
                 (e.acara.toLowerCase() === saved.event.acara.toLowerCase())
        );

        if (idx !== -1) {
          const fetchedEvt = updatedEvents[idx];
          const isFresh = (
            fetchedEvt.statusKeberangkatan === saved.event.statusKeberangkatan &&
            fetchedEvt.keterangan.trim().toLowerCase() === saved.event.keterangan.trim().toLowerCase()
          );

          if (isFresh) {
            // Google Sheets CSV sudah mencerminkan status terbaru
            recentlySavedRef.current.delete(key);
          } else {
            // Cache Google Sheets belum terpropagasi; pertahankan data terbaru agar tampilan tidak melompat mundur
            updatedEvents[idx] = {
              ...fetchedEvt,
              ...saved.event,
              id: fetchedEvt.id,
            };
            hasPreservedChanges = true;
          }
        }
      });

      const finalBahsuRes = hasPreservedChanges
        ? {
            ...bahsuRes,
            events: updatedEvents,
            totalAgenda: updatedEvents.length,
            totalBelumBerangkat: updatedEvents.filter((e) => e.statusKeberangkatan === 'BELUM_BERANGKAT').length,
            totalSudahBerangkat: updatedEvents.filter((e) => e.statusKeberangkatan === 'SUDAH_BERANGKAT').length,
            totalIzin: updatedEvents.filter((e) => e.statusKeberangkatan === 'IZIN').length,
          }
        : bahsuRes;

      setData(finalBahsuRes);
      if (anggotaRes?.anggota) {
        setAnggotaList(anggotaRes.anggota);
      }
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error('Fetch Bahsu client error:', err);
      // Tampilkan error jika data belum ada sama sekali atau jika pengguna menekan Perbarui secara manual
      if (!dataRef.current || showIndicator) {
        setError(err?.message || 'Gagal menyinkronkan jadwal & delegasi Bahtsul Masail dari Google Sheets.');
      }
    } finally {
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  // Handler tombol "Perbarui" manual dengan Next.js Server Revalidation & Client Sync
  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
    });
    fetchBahsu(true);
  }, [router, fetchBahsu]);

  // Handler optimistik saat agenda baru ditambahkan / diedit lewat modal
  const handleRefresh = useCallback((savedEvent = null) => {
    if (savedEvent && savedEvent.acara) {
      const derivedStatus = savedEvent.statusKeberangkatan ||
        parseStatusKeberangkatan(savedEvent.keterangan, savedEvent.no, savedEvent.tanggal, savedEvent.acara);

      const formattedEvent = {
        no: savedEvent.no ? String(savedEvent.no) : '',
        acara: savedEvent.acara,
        tanggal: savedEvent.tanggal,
        delegasi: Array.isArray(savedEvent.delegasi) ? savedEvent.delegasi : [],
        keterangan: savedEvent.keterangan || 'SUDAH',
        isBelumBerangkat: derivedStatus === 'BELUM_BERANGKAT',
        statusKeberangkatan: derivedStatus,
      };

      // Simpan di recentlySavedRef agar tidak tertimpa fetch Google Sheets yang masih dalam masa propagasi cache
      const saveKey = String(savedEvent.no || savedEvent.acara).toLowerCase();
      recentlySavedRef.current.set(saveKey, { event: formattedEvent, time: Date.now() });

      setData((prevData) => {
        if (!prevData) return prevData;
        const currentEvents = [...(prevData.events || [])];
        const existingIdx = currentEvents.findIndex(
          (e) => (savedEvent.no && String(e.no) === String(savedEvent.no)) ||
                 (e.acara.toLowerCase() === savedEvent.acara.toLowerCase() && (!savedEvent.tanggal || e.tanggal === savedEvent.tanggal))
        );

        formattedEvent.id = existingIdx !== -1 ? currentEvents[existingIdx].id : currentEvents.length + 1;
        if (!formattedEvent.no) {
          formattedEvent.no = String(existingIdx !== -1 ? currentEvents[existingIdx].no : currentEvents.length + 1);
        }

        if (existingIdx !== -1) {
          currentEvents[existingIdx] = formattedEvent;
        } else {
          currentEvents.push(formattedEvent);
        }

        const totalAgenda = currentEvents.length;
        const totalBelumBerangkat = currentEvents.filter((e) => e.statusKeberangkatan === 'BELUM_BERANGKAT').length;
        const totalSudahBerangkat = currentEvents.filter((e) => e.statusKeberangkatan === 'SUDAH_BERANGKAT').length;
        const totalIzin = currentEvents.filter((e) => e.statusKeberangkatan === 'IZIN').length;

        return {
          ...prevData,
          events: currentEvents,
          totalAgenda,
          totalBelumBerangkat,
          totalSudahBerangkat,
          totalIzin,
        };
      });
    }

    // Refresh data kanonikal dari Google Sheets di latar belakang
    startTransition(() => {
      router.refresh();
    });
    fetchBahsu(false);
  }, [router, fetchBahsu]);

  // Sinkronisasi otomatis di latar belakang & saat tab aktif kembali
  useBackgroundSync(fetchBahsu, { lastFetchRef });

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
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1D7A6F] text-white hover:bg-[#165E55] text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
            title="Tambah Agenda Bahtsul Masail Baru dan Sinkronkan ke Google Sheets"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda</span>
          </button>
          <button
            onClick={() => { if (typeof window !== 'undefined') window.print(); }}
            disabled={!data || data?.events?.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            title="Cetak Laporan Bahtsul Masail atau Simpan sebagai PDF"
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
          <AdminButton editUrl={DATA_LINKS.bahsu.editUrl} title="Edit di Sheets" />
        </div>
      </div>

      {/* Error state alert */}
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
      <BahsuTable
        events={data?.events || []}
        title={data?.title}
        editUrl={DATA_LINKS.bahsu.editUrl}
        anggotaList={anggotaList}
        isAddModalOpen={isAddModalOpen}
        onCloseAddModal={() => setIsAddModalOpen(false)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
