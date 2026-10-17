'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, RotateCcw, User, GraduationCap, Activity, FileSpreadsheet, Info, ChevronRight, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { STATUS_COLORS } from './PieChart';
import AdminButton from './AdminButton';
import AnggotaDetailModal from './AnggotaDetailModal';
import { PrintHeader, PrintSignatures } from './PrintHeaderFooter';
import { useAuth } from '@/lib/auth';

// Urutan hierarki standar tingkatan kelas (Aliyah tertinggi ke Tsanawiyah terendah)
const CLASS_ORDER = [
  '3 ALIYAH',
  '2 Aliyah',
  '2 M ALIYAH',
  '2 MA',
  '2 ALIYAH',
  '1 ALIYAH',
  '3 Tsanawiyah',
  '2 Tsanawiyah',
  '1 Tsanawiyah',
];

export default function AnggotaTable({ anggota = [], editUrl, onRefresh }) {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAnggota, setSelectedAnggota] = useState(null);

  // Ekstrak daftar unik Kelas & Status untuk filter dropdown
  const { kelasList, statusList, hasTanpaKelas } = useMemo(() => {
    const kSet = new Set();
    const sSet = new Set();
    let tanpaKelas = false;

    anggota.forEach((item) => {
      if (item.kelas && item.kelas !== '-') {
        kSet.add(item.kelas);
      } else {
        tanpaKelas = true;
      }
      if (item.perkembangan) sSet.add(item.perkembangan);
    });

    // Urutkan kelas sesuai jenjang pendidikan (3 ALIYAH s/d 1 Tsanawiyah)
    const sortedKelas = Array.from(kSet).sort((a, b) => {
      const idxA = CLASS_ORDER.indexOf(a);
      const idxB = CLASS_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return {
      kelasList: sortedKelas,
      statusList: Array.from(sSet).sort(),
      hasTanpaKelas: tanpaKelas,
    };
  }, [anggota]);

  // Filter anggota berdasarkan pencarian, kelas, dan status
  const filteredAnggota = useMemo(() => {
    return anggota.filter((item) => {
      const matchSearch =
        search === '' ||
        item.nama.toLowerCase().includes(search.toLowerCase());

      const matchKelas =
        selectedKelas === '' ||
        (selectedKelas === '-' ? item.kelas === '-' : item.kelas === selectedKelas);

      const matchStatus =
        selectedStatus === '' ||
        item.perkembangan === selectedStatus;

      return matchSearch && matchKelas && matchStatus;
    });
  }, [anggota, search, selectedKelas, selectedStatus]);

  const handleReset = () => {
    setSearch('');
    setSelectedKelas('');
    setSelectedStatus('');
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const isFiltering = search !== '' || selectedKelas !== '' || selectedStatus !== '';

  const filterDescription = useMemo(() => {
    const parts = [];
    if (search) parts.push(`Pencarian: "${search}"`);
    if (selectedKelas) parts.push(`Kelas: ${selectedKelas}`);
    if (selectedStatus) parts.push(`Status: ${selectedStatus}`);
    return parts.length > 0 ? parts.join(' | ') : 'Semua Anggota Terdaftar';
  }, [search, selectedKelas, selectedStatus]);

  return (
    <div className="space-y-4">
      
      {/* KOP SURAT RESMI CETAK (HANYA MUNCUL DI PRINT / PDF) */}
      <PrintHeader
        title="Laporan Data Anggota Lembaga Bahtsul Masail (LBM)"
        subtitle="Pondok Pesantren Darussalam Sumbersari Kencong Pare Kediri"
        filterInfo={filterDescription}
        totalInfo={`${filteredAnggota.length} Santri`}
      />

      <div className="bg-white rounded-xl shadow-xs border border-[#DCE5E0] overflow-hidden card-print">
        

        {/* Baris Pencarian & Filter */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#DCE5E0] space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          
          {/* Input Search Nama */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-[#5C6E66] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama santri..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#DCE5E0] text-sm focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 text-[#26332E] placeholder-[#5C6E66]/60 bg-white"
            />
          </div>

          {/* Filter Kelas */}
          <div className="sm:col-span-3">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] text-sm focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 text-[#26332E] bg-white cursor-pointer"
            >
              <option value="">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k} value={k}>
                  {k.toLowerCase().startsWith('kelas') ? k : `Kelas ${k}`}
                </option>
              ))}
              {hasTanpaKelas && <option value="-">Tanpa Kelas (-)</option>}
            </select>
          </div>

          {/* Filter Status Perkembangan */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] text-sm focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 text-[#26332E] bg-white cursor-pointer"
            >
              <option value="">Semua Status Evaluasi</option>
              {statusList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Reset Filter */}
          <div className="sm:col-span-1 flex items-center justify-center">
            {isFiltering && (
              <button
                onClick={handleReset}
                title="Reset Filter"
                className="w-full sm:w-auto p-2 rounded-lg text-[#5C6E66] hover:text-[#8A2F1B] hover:bg-[#FAF0ED] border border-[#DCE5E0] transition-colors flex items-center justify-center cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Info tag filter aktif */}
        {isFiltering && (
          <div className="flex items-center gap-2 text-xs text-[#5C6E66] pt-0.5">
            <span>Filter aktif:</span>
            {search && <span className="bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] px-2 py-0.5 rounded font-medium">&ldquo;{search}&rdquo;</span>}
            {selectedKelas && <span className="bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] px-2 py-0.5 rounded font-medium">Kelas: {selectedKelas}</span>}
            {selectedStatus && <span className="bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] px-2 py-0.5 rounded font-medium">{selectedStatus}</span>}
          </div>
        )}
      </div>

      {/* Tabel Data Anggota (Desktop & Tablet) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#F7F5EF] border-b border-[#DCE5E0] text-[11px] font-bold text-[#5C6E66] uppercase tracking-wider">
              <th className="py-3 px-4 sm:px-6 w-14 text-center">No</th>
              <th className="py-3 px-4 sm:px-6">Nama Santri</th>
              <th className="py-3 px-4 sm:px-6 w-32">Kelas</th>
              <th className="py-3 px-4 sm:px-6">Status Perkembangan</th>
              <th className="py-3 px-4 sm:px-6 w-24 text-center no-print">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE5E0]/60">
            {filteredAnggota.length > 0 ? (
              filteredAnggota.map((item, idx) => {
                const styling = STATUS_COLORS[item.perkembangan] || {
                  color: '#6E7C77',
                  bgBadge: 'bg-[#F7F5EF]',
                  textBadge: 'text-[#26332E]',
                  border: 'border-[#DCE5E0]',
                };

                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-[#F7F5EF]/50 transition-colors group/row"
                  >
                    <td className="py-3.5 px-4 sm:px-6 text-center font-mono text-xs text-[#5C6E66]">
                      {idx + 1}
                    </td>

                    {/* Kolom Nama Santri Clickable */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <motion.button
                        type="button"
                        onClick={() => setSelectedAnggota(item)}
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="text-left font-bold text-[#26332E] hover:text-[#1D7A6F] inline-flex items-center gap-2 group cursor-pointer focus:outline-hidden"
                        title="Klik untuk melihat detail profil santri & riwayat bahtsu"
                      >
                        <span className="group-hover:underline underline-offset-2 decoration-[#1D7A6F]">
                          {item.nama}
                        </span>

                        {item.bahtsuList && item.bahtsuList.length > 0 && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FAF3E6] text-[#8C6D23] border border-[#E8D5A7] group-hover:bg-[#C6A66B] group-hover:text-white transition-colors font-mono"
                            title={`${item.bahtsuList.length} forum Bahtsul Masail dihadiri`}
                          >
                            {item.bahtsuList.length} BM
                          </span>
                        )}
                      </motion.button>
                    </td>

                    {/* Kolom Kelas */}
                    <td className="py-3.5 px-4 sm:px-6">
                      {item.kelas && item.kelas !== '-' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#1D7A6F] bg-[#E8F5F3] px-2 py-0.5 rounded text-xs border border-[#C8E3DC]">
                          <GraduationCap className="w-3.5 h-3.5 text-[#1D7A6F]" />
                          {item.kelas}
                        </span>
                      ) : (
                        <span className="text-[#5C6E66] text-xs italic">-</span>
                      )}
                    </td>

                    {/* Kolom Status Perkembangan */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border ${styling.bgBadge} ${styling.textBadge} ${styling.border}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: styling.color }}
                        />
                        {item.perkembangan}
                      </span>
                    </td>

                    {/* Kolom Aksi / Tombol Detail & Edit */}
                    <td className="py-3.5 px-4 sm:px-6 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <motion.button
                          type="button"
                          onClick={() => setSelectedAnggota(item)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-2.5 py-1 text-xs font-semibold text-[#1D7A6F] bg-[#E8F5F3] hover:bg-[#1D7A6F] hover:text-white rounded border border-[#C8E3DC] transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Lihat detail lengkap"
                        >
                          <span>Detail</span>
                          <ChevronRight className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#5C6E66] text-sm">
                  Tidak ada anggota yang sesuai dengan pencarian atau filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilan Kartu Khusus Layar HP / Mobile */}
      <div className="md:hidden divide-y divide-[#DCE5E0]/60 no-print">
        {filteredAnggota.length > 0 ? (
          filteredAnggota.map((item, idx) => {
            const styling = STATUS_COLORS[item.perkembangan] || {
              color: '#6E7C77',
              bgBadge: 'bg-[#F7F5EF]',
              textBadge: 'text-[#26332E]',
              border: 'border-[#DCE5E0]',
            };

            return (
              <div
                key={item.id || idx}
                onClick={() => setSelectedAnggota(item)}
                className="p-4 space-y-2.5 hover:bg-[#F7F5EF]/60 transition-colors cursor-pointer active:bg-[#E8F5F3]/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F7F5EF] text-[#5C6E66] border border-[#DCE5E0] shrink-0">
                      #{idx + 1}
                    </span>
                    <h3 className="font-bold text-[#26332E] text-sm truncate">
                      {item.nama}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${styling.bgBadge} ${styling.textBadge} ${styling.border}`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: styling.color }}
                    />
                    {item.perkembangan}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="flex items-center gap-1.5">
                    {item.kelas && item.kelas !== '-' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#1D7A6F] bg-[#E8F5F3] px-2 py-0.5 rounded text-[11px] border border-[#C8E3DC]">
                        <GraduationCap className="w-3 h-3 text-[#1D7A6F]" />
                        {item.kelas}
                      </span>
                    ) : (
                      <span className="text-[#5C6E66] text-xs italic">-</span>
                    )}

                    {item.bahtsuList && item.bahtsuList.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF3E6] text-[#8C6D23] border border-[#E8D5A7] font-mono">
                        {item.bahtsuList.length} BM
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D7A6F]">
                    <span>Profil</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-[#5C6E66] text-sm">
            Tidak ada anggota yang sesuai dengan filter atau pencarian.
          </div>
        )}
      </div>

      {/* Footer Ringkasan */}
      <div className="p-3.5 bg-[#F7F5EF]/50 border-t border-[#DCE5E0] text-xs text-[#5C6E66] flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
        <div className="flex items-center gap-1.5 text-[#1D7A6F]">
          <Info className="w-3.5 h-3.5 text-[#C6A66B] shrink-0" />
          <span>Klik nama santri atau tombol &ldquo;Detail&rdquo; untuk membuka arsip biodata &amp; riwayat delegasi</span>
        </div>
        <span>Menampilkan {filteredAnggota.length} dari {anggota.length} santri</span>
      </div>

      </div>

      {/* Tanda Tangan Resmi Pengesahan (Hanya Muncul di Print / PDF) */}
      <PrintSignatures
        leftTitle="Mengetahui,"
        leftRole="Kepala MMD Darussalamah"
        rightRole="WAKA III / Koordinator LBM"
      />

      {/* Modal Detail Anggota Santri */}
      <AnggotaDetailModal
        anggota={selectedAnggota}
        onClose={() => setSelectedAnggota(null)}
      />

    </div>
  );
}


