'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  RotateCcw,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
  Hourglass,
  Printer,
  Edit3,
  Plus,
} from 'lucide-react';
import AdminButton from './AdminButton';
import EditBahsuModal from './EditBahsuModal';
import { PrintHeader, PrintSignatures } from './PrintHeaderFooter';
import { useAuth } from '@/lib/auth';
import { findAnggotaByDelegasiName } from '@/lib/fetchCSV';

export default function BahsuTable({
  events = [],
  title,
  editUrl,
  anggotaList = [],
  onRefresh,
  isAddModalOpen = false,
  onCloseAddModal,
}) {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'BELUM' | 'SUDAH' | 'IZIN'
  const [editingBahsuEvent, setEditingBahsuEvent] = useState(null);
  const [isBahsuModalOpen, setIsBahsuModalOpen] = useState(false);

  // Hitung nomor urut agenda berikutnya secara otomatis
  const nextSuggestedNo = useMemo(() => {
    let maxNo = 0;
    for (const e of events) {
      const n = parseInt(e.no, 10);
      if (!isNaN(n) && n > maxNo) {
        maxNo = n;
      }
    }
    return maxNo > 0 ? maxNo + 1 : events.length + 1;
  }, [events]);

  const effectiveModalOpen = isBahsuModalOpen || isAddModalOpen;

  const handleOpenAddEvent = () => {
    setEditingBahsuEvent(null);
    setIsBahsuModalOpen(true);
  };

  const handleOpenEditEvent = (eventItem) => {
    setEditingBahsuEvent(eventItem);
    setIsBahsuModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsBahsuModalOpen(false);
    setEditingBahsuEvent(null);
    if (typeof onCloseAddModal === 'function') {
      onCloseAddModal();
    }
  };

  const handleEditSuccess = (savedEvent = null) => {
    handleCloseModal();
    if (typeof onRefresh === 'function') {
      onRefresh(savedEvent);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Filter pencarian dan status
  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        search === '' ||
        item.acara.toLowerCase().includes(q) ||
        item.tanggal.toLowerCase().includes(q) ||
        item.delegasi.some((d) => d.toLowerCase().includes(q)) ||
        item.keterangan.toLowerCase().includes(q);

      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'BELUM' && item.statusKeberangkatan === 'BELUM_BERANGKAT') ||
        (filterStatus === 'SUDAH' && item.statusKeberangkatan === 'SUDAH_BERANGKAT') ||
        (filterStatus === 'IZIN' && item.statusKeberangkatan === 'IZIN');

      return matchSearch && matchStatus;
    });
  }, [events, search, filterStatus]);

  const totalBelumBerangkat = useMemo(() => {
    return events.filter((e) => e.statusKeberangkatan === 'BELUM_BERANGKAT').length;
  }, [events]);

  const totalSudahBerangkat = useMemo(() => {
    return events.filter((e) => e.statusKeberangkatan === 'SUDAH_BERANGKAT').length;
  }, [events]);

  const totalIzin = useMemo(() => {
    return events.filter((e) => e.statusKeberangkatan === 'IZIN').length;
  }, [events]);

  const filterDescription = useMemo(() => {
    const parts = [];
    if (search) parts.push(`Pencarian: "${search}"`);
    if (filterStatus === 'BELUM') parts.push('Status: Belum Berangkat');
    if (filterStatus === 'SUDAH') parts.push('Status: Sudah Berangkat');
    if (filterStatus === 'IZIN') parts.push('Status: Izin / Berhalangan');
    return parts.length > 0 ? parts.join(' | ') : 'Semua Agenda Terjadwal';
  }, [search, filterStatus]);

  return (
    <div className="space-y-6">
      
      {/* KOP SURAT RESMI CETAK (HANYA MUNCUL DI PRINT / PDF) */}
      <PrintHeader
        title="Laporan Jadwal Pemberangkatan & Delegasi Bahtsul Masail"
        subtitle="Pondok Pesantren Darussalam Sumbersari Kencong Pare Kediri"
        filterInfo={filterDescription}
        totalInfo={`${filteredEvents.length} Forum (${totalBelumBerangkat} Belum Berangkat, ${totalSudahBerangkat} Selesai, ${totalIzin} Izin)`}
      />

      {/* 4 Kartu Ringkasan Atas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 no-print">
        
        {/* Kartu 1: Total Forum (Reset Filter ke ALL) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setFilterStatus('ALL');
            const el = document.getElementById('table-bahsu-agenda');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterStatus('ALL');
              const el = document.getElementById('table-bahsu-agenda');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className={`cursor-pointer rounded-xl p-5 border shadow-xs flex items-center justify-between transition-all duration-200 select-none group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F] ${
            filterStatus === 'ALL'
              ? 'bg-[#E8F5F3] border-[#C8E3DC] ring-1 ring-[#1D7A6F]'
              : 'bg-white border-[#DCE5E0] hover:border-[#1D7A6F] hover:shadow-xs'
          }`}
          title="Klik untuk menampilkan semua agenda forum Bahtsul Masail"
          aria-label={`Total ${events.length} Forum Bahsu. Klik untuk menampilkan semua agenda.`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E66] group-hover:text-[#1D7A6F] transition-colors">
              Total Forum Bahsu
            </span>
            <div className="text-2xl font-black text-[#26332E] mt-1 font-serif">
              {events.length} Agenda
            </div>
            <p className="text-xs text-[#5C6E66] mt-0.5">
              {filterStatus === 'ALL' ? 'Menampilkan semua' : 'Klik untuk tampilkan semua'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#F7F5EF] text-[#1D7A6F] flex items-center justify-center shrink-0 border border-[#DCE5E0] group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Kartu 2: Filter Belum Berangkat */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setFilterStatus(filterStatus === 'BELUM' ? 'ALL' : 'BELUM');
            const el = document.getElementById('table-bahsu-agenda');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterStatus(filterStatus === 'BELUM' ? 'ALL' : 'BELUM');
              const el = document.getElementById('table-bahsu-agenda');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className={`cursor-pointer rounded-xl p-5 border shadow-xs flex items-center justify-between transition-all duration-200 select-none group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C6A66B] ${
            filterStatus === 'BELUM'
              ? 'bg-[#FAF3E6] border-[#E8D5A7] ring-1 ring-[#C6A66B]'
              : 'bg-white border-[#DCE5E0] hover:border-[#C6A66B] hover:shadow-xs'
          }`}
          title="Klik untuk memfilter agenda yang belum berangkat"
          aria-label={`${totalBelumBerangkat} forum belum berangkat. Klik untuk filter.`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D23]">
              Belum Berangkat
            </span>
            <div className="text-2xl font-black text-[#8C6D23] mt-1 font-serif">
              {totalBelumBerangkat} Forum
            </div>
            <p className="text-xs text-[#8C6D23]/80 mt-0.5">
              {filterStatus === 'BELUM' ? 'Filter aktif' : 'Klik untuk filter'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#FAF3E6] text-[#8C6D23] flex items-center justify-center shrink-0 border border-[#E8D5A7] group-hover:scale-105 transition-transform">
            <Hourglass className="w-5 h-5" />
          </div>
        </div>

        {/* Kartu 3: Filter Sudah Berangkat */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setFilterStatus(filterStatus === 'SUDAH' ? 'ALL' : 'SUDAH');
            const el = document.getElementById('table-bahsu-agenda');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterStatus(filterStatus === 'SUDAH' ? 'ALL' : 'SUDAH');
              const el = document.getElementById('table-bahsu-agenda');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className={`cursor-pointer rounded-xl p-5 border shadow-xs flex items-center justify-between transition-all duration-200 select-none group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F] ${
            filterStatus === 'SUDAH'
              ? 'bg-[#E8F5F3] border-[#C8E3DC] ring-1 ring-[#1D7A6F]'
              : 'bg-white border-[#DCE5E0] hover:border-[#1D7A6F] hover:shadow-xs'
          }`}
          title="Klik untuk memfilter agenda yang sudah berangkat"
          aria-label={`${totalSudahBerangkat} forum sudah berangkat. Klik untuk filter.`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D7A6F]">
              Sudah Berangkat
            </span>
            <div className="text-2xl font-black text-[#1D7A6F] mt-1 font-serif">
              {totalSudahBerangkat} Forum
            </div>
            <p className="text-xs text-[#1D7A6F]/80 mt-0.5">
              {filterStatus === 'SUDAH' ? 'Filter aktif' : 'Klik untuk filter'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#E8F5F3] text-[#1D7A6F] flex items-center justify-center shrink-0 border border-[#C8E3DC] group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Kartu 4: Filter Izin / Batal */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setFilterStatus(filterStatus === 'IZIN' ? 'ALL' : 'IZIN');
            const el = document.getElementById('table-bahsu-agenda');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterStatus(filterStatus === 'IZIN' ? 'ALL' : 'IZIN');
              const el = document.getElementById('table-bahsu-agenda');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className={`cursor-pointer rounded-xl p-5 border shadow-xs flex items-center justify-between transition-all duration-200 select-none group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#A8382B] ${
            filterStatus === 'IZIN'
              ? 'bg-[#FAF0ED] border-[#E8BCB0] ring-1 ring-[#A8382B]'
              : 'bg-white border-[#DCE5E0] hover:border-[#A8382B] hover:shadow-xs'
          }`}
          title="Klik untuk memfilter agenda yang izin / batal"
          aria-label={`${totalIzin} forum izin / batal. Klik untuk filter.`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A2F1B]">
              Izin / Batal
            </span>
            <div className="text-2xl font-black text-[#8A2F1B] mt-1 font-serif">
              {totalIzin} Forum
            </div>
            <p className="text-xs text-[#8A2F1B]/80 mt-0.5">
              {filterStatus === 'IZIN' ? 'Filter aktif' : 'Surat mepet / ujian'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#FAF0ED] text-[#8A2F1B] flex items-center justify-center shrink-0 border border-[#E8BCB0] group-hover:scale-105 transition-transform">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Kontainer Utama Tabel / List */}
      <div id="table-bahsu-agenda" className="bg-white rounded-xl shadow-xs border border-[#DCE5E0] overflow-hidden card-print scroll-mt-28">
        {/* Baris Pencarian & Filter Status */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#DCE5E0] space-y-3.5 no-print">
          
          {/* Header Aksi Tabel: Judul & Tombol Tambah Agenda */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE5E0]/60">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#26332E] font-serif flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1D7A6F]" />
                <span>Jadwal Kegiatan &amp; Utusan Delegasi</span>
              </h2>
              <p className="text-xs text-[#5C6E66] mt-0.5">
                Kelola jadwal forum Bahtsul Masail dan utusan santri LBM Darussalamah langsung tersinkron ke Google Sheets
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddEvent}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1D7A6F] text-white hover:bg-[#165E55] text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
              title="Tambah Agenda Bahtsul Masail Baru dan Sinkronkan Otomatis ke Google Sheets"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Agenda</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            
            {/* Input Search */}
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-[#5C6E66] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama forum, lokasi (Lirboyo, Ploso, Tuban), atau nama santri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#DCE5E0] text-sm focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 text-[#26332E] placeholder-[#5C6E66]/60 bg-white"
              />
            </div>

            {/* Filter Status */}
            <div className="sm:col-span-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] text-sm focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 text-[#26332E] bg-white font-medium cursor-pointer"
              >
                <option value="ALL">Semua Status ({events.length})</option>
                <option value="BELUM">★ Belum Berangkat ({totalBelumBerangkat})</option>
                <option value="SUDAH">Sudah Berangkat ({totalSudahBerangkat})</option>
                <option value="IZIN">Izin / Berhalangan ({totalIzin})</option>
              </select>
            </div>

            {/* Reset */}
            <div className="sm:col-span-1 flex items-center justify-center">
              {(search || filterStatus !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterStatus('ALL');
                  }}
                  title="Reset Filter"
                  className="w-full sm:w-auto p-2 rounded-lg text-[#5C6E66] hover:text-[#8A2F1B] hover:bg-[#FAF0ED] border border-[#DCE5E0] transition-colors flex items-center justify-center cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {(search || filterStatus !== 'ALL') && (
            <div className="text-xs text-[#5C6E66] flex items-center gap-2 pt-0.5">
              <span>Menemukan <strong>{filteredEvents.length}</strong> dari {events.length} agenda</span>
            </div>
          )}
        </div>

        {/* Tabel Tampilan Desktop */}
        <div className="overflow-x-auto hidden md:block print:block">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F7F5EF] border-b border-[#DCE5E0] text-[11px] font-bold text-[#5C6E66] uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-5 w-1/3">Forum Bahtsul Masail &amp; Tempat</th>
                <th className="py-3 px-4 w-44">Tanggal Pelaksanaan</th>
                <th className="py-3 px-5">Delegasi Santri</th>
                <th className="py-3 px-4 w-44 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5E0]/60">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((item, idx) => {
                  const isBelum = item.statusKeberangkatan === 'BELUM_BERANGKAT';
                  const isIzin = item.statusKeberangkatan === 'IZIN';

                  return (
                    <tr key={item.id || idx} className="hover:bg-[#F7F5EF]/50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-[#5C6E66]">
                        {item.no || idx + 1}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-[#26332E] text-sm leading-snug">
                            {item.acara}
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditEvent(item)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-[#1D7A6F] bg-white hover:bg-[#1D7A6F] hover:text-white border border-[#C8E3DC] transition-colors shrink-0 cursor-pointer no-print shadow-2xs"
                              title="Edit kegiatan & sinkronkan ke sheet PERKEMBANGAN"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Agenda</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#26332E] bg-[#F7F5EF] px-2.5 py-1 rounded border border-[#DCE5E0] font-mono">
                          <Clock className="w-3.5 h-3.5 text-[#C6A66B]" />
                          {item.tanggal}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {item.delegasi && item.delegasi.length > 0 ? (
                          <div className="space-y-1.5">
                            {item.delegasi.map((del, dIdx) => {
                              const isKomisi =
                                del.toUpperCase().startsWith('KOMISI') ||
                                del.toUpperCase().startsWith('KOM ');
                              const matchedAnggota = !isKomisi
                                ? findAnggotaByDelegasiName(del, anggotaList)
                                : null;

                              return (
                                <div
                                  key={dIdx}
                                  className={`text-xs ${
                                    isKomisi
                                      ? 'font-bold text-[#1D7A6F] mt-1 pt-1 border-t border-[#DCE5E0]'
                                      : 'text-[#26332E] flex items-center justify-between gap-2 py-0.5'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {!isKomisi && (
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                          matchedAnggota ? 'bg-[#1D7A6F]' : 'bg-[#C6A66B]'
                                        }`}
                                      />
                                    )}
                                    <span className={matchedAnggota ? 'font-medium' : ''}>
                                      {del}
                                    </span>
                                    {matchedAnggota && (
                                      <span
                                        className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] no-print shrink-0"
                                        title={`ID Anggota: ${matchedAnggota.id} • ${matchedAnggota.kelas}`}
                                      >
                                        {matchedAnggota.id}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[#5C6E66] text-xs italic">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isIzin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FAF0ED] text-[#8A2F1B] border border-[#E8BCB0]">
                            <XCircle className="w-3.5 h-3.5" />
                            {item.keterangan}
                          </span>
                        ) : isBelum ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FAF3E6] text-[#8C6D23] border border-[#E8D5A7]">
                            <Hourglass className="w-3.5 h-3.5 text-[#8C6D23]" />
                            Belum Berangkat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1D7A6F]" />
                            {item.keterangan || 'Delegasi'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#5C6E66] text-sm">
                    Tidak ada agenda Bahtsul Masail yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tampilan Kartu Khusus Mobile (Disembunyikan saat cetak) */}
        <div className="md:hidden divide-y divide-[#DCE5E0]/60 no-print">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((item, idx) => {
              const isBelum = item.statusKeberangkatan === 'BELUM_BERANGKAT';
              const isIzin = item.statusKeberangkatan === 'IZIN';

              return (
                <div key={item.id || idx} className="p-4 space-y-2.5 hover:bg-[#F7F5EF]/50">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#F7F5EF] text-[#5C6E66] border border-[#DCE5E0]">
                      #{item.no || idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditEvent(item)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-[#1D7A6F] bg-white hover:bg-[#1D7A6F] hover:text-white border border-[#C8E3DC] transition-colors shadow-2xs"
                          title="Edit agenda"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Edit</span>
                        </button>
                      )}
                      {isIzin ? (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-[#FAF0ED] text-[#8A2F1B] border border-[#E8BCB0]">
                          {item.keterangan}
                        </span>
                      ) : isBelum ? (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-[#FAF3E6] text-[#8C6D23] border border-[#E8D5A7]">
                          Belum Berangkat
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC]">
                          {item.keterangan || 'Delegasi'}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-[#26332E] text-sm">
                    {item.acara}
                  </h3>

                  <div className="text-xs text-[#5C6E66] flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#C6A66B]" />
                    <span>{item.tanggal}</span>
                  </div>

                  {item.delegasi && item.delegasi.length > 0 && (
                    <div className="p-3 rounded-lg bg-[#F7F5EF] border border-[#DCE5E0] text-xs space-y-1.5">
                      <span className="font-semibold text-[#1D7A6F] block mb-1">Delegasi:</span>
                      {item.delegasi.map((del, dIdx) => {
                        const isKomisi =
                          del.toUpperCase().startsWith('KOMISI') ||
                          del.toUpperCase().startsWith('KOM ');
                        const matchedAnggota = !isKomisi
                          ? findAnggotaByDelegasiName(del, anggotaList)
                          : null;

                        return (
                          <div
                            key={dIdx}
                            className={`flex items-center justify-between gap-2 py-0.5 ${
                              isKomisi ? 'font-bold text-[#1D7A6F] pt-1' : 'text-[#26332E]'
                            }`}
                          >
                            <span className="truncate">{del}</span>
                            {matchedAnggota && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] shrink-0">
                                {matchedAnggota.id}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-[#5C6E66] text-sm">
              Tidak ada agenda Bahtsul Masail yang cocok.
            </div>
          )}
        </div>

      </div>

      {/* Tanda Tangan Resmi Pengesahan Laporan */}
      <PrintSignatures rightRole="WAKA III / Koordinator Bahtsul Masail" />

      {/* Modal Edit / Tambah Kegiatan Bahtsul Masail & Sinkronisasi */}
      <EditBahsuModal
        isOpen={effectiveModalOpen}
        onClose={handleCloseModal}
        event={editingBahsuEvent}
        suggestedNo={nextSuggestedNo}
        anggotaList={anggotaList}
        onSuccess={handleEditSuccess}
      />

    </div>
  );
}
