'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, RotateCcw, User, GraduationCap, Activity, FileSpreadsheet, Info, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { STATUS_COLORS } from './PieChart';
import AdminButton from './AdminButton';
import AnggotaDetailModal from './AnggotaDetailModal';

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

export default function AnggotaTable({ anggota = [], editUrl }) {
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

  const isFiltering = search !== '' || selectedKelas !== '' || selectedStatus !== '';

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-[#2A9D8F]/15 overflow-hidden">
      
      {/* Header Tabel & Tombol Admin */}
      <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFCF5]">
        <div>
          <h2 className="text-xl font-bold text-[#2D3436] flex items-center gap-2">
            <User className="w-5 h-5 text-[#2A9D8F]" />
            Daftar Anggota LBM
          </h2>
          <p className="text-xs text-[#636E72] mt-0.5">
            Menampilkan {filteredAnggota.length} dari {anggota.length} anggota santri LBM • Klik nama santri untuk melihat biodata lengkap
          </p>
        </div>

        {/* Tombol Admin Google Sheets */}
        <AdminButton editUrl={editUrl} title="Edit Anggota di Sheets" />
      </div>

      {/* Baris Pencarian & Filter */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-100 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Input Search Nama */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-[#2A9D8F] focus:ring-2 focus:ring-[#2A9D8F]/20 text-[#2D3436] placeholder-gray-400"
            />
          </div>

          {/* Filter Kelas */}
          <div className="sm:col-span-3">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-[#2A9D8F] focus:ring-2 focus:ring-[#2A9D8F]/20 text-[#2D3436] bg-white cursor-pointer"
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
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-[#2A9D8F] focus:ring-2 focus:ring-[#2A9D8F]/20 text-[#2D3436] bg-white"
            >
              <option value="">Semua Status</option>
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
                className="w-full sm:w-auto p-2.5 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 transition-colors flex items-center justify-center cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Info tag filter aktif */}
        {isFiltering && (
          <div className="flex items-center gap-2 text-xs text-[#636E72] pt-1">
            <span>Filter aktif:</span>
            {search && <span className="bg-[#E8F5F3] text-[#1D7A6F] px-2 py-0.5 rounded-md font-medium">&ldquo;{search}&rdquo;</span>}
            {selectedKelas && <span className="bg-[#E8F5F3] text-[#1D7A6F] px-2 py-0.5 rounded-md font-medium">Kelas: {selectedKelas}</span>}
            {selectedStatus && <span className="bg-[#E8F5F3] text-[#1D7A6F] px-2 py-0.5 rounded-md font-medium">{selectedStatus}</span>}
          </div>
        )}
      </div>

      {/* Tabel Data Anggota */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#FDF6E3] border-b border-[#2A9D8F]/20 text-xs font-semibold text-[#636E72] uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6 w-16 text-center">No</th>
              <th className="py-3.5 px-4 sm:px-6">Nama Santri</th>
              <th className="py-3.5 px-4 sm:px-6 w-32">Kelas</th>
              <th className="py-3.5 px-4 sm:px-6">Status Perkembangan</th>
              <th className="py-3.5 px-4 sm:px-6 w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAnggota.length > 0 ? (
              filteredAnggota.map((item, idx) => {
                const styling = STATUS_COLORS[item.perkembangan] || {
                  color: '#64748B',
                  bgBadge: 'bg-gray-100',
                  textBadge: 'text-gray-700',
                  border: 'border-gray-200',
                };

                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-[#FFFCF5] transition-colors group/row"
                  >
                    <td className="py-3.5 px-4 sm:px-6 text-center font-medium text-gray-400">
                      {idx + 1}
                    </td>

                    {/* Kolom Nama Santri Clickable dengan Framer Motion */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <motion.button
                        type="button"
                        onClick={() => setSelectedAnggota(item)}
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="text-left font-bold text-[#2D3436] hover:text-[#1D7A6F] inline-flex items-center gap-2 group cursor-pointer focus:outline-hidden"
                        title="Klik untuk melihat detail profil santri & riwayat bahtsu"
                      >
                        <span className="group-hover:underline underline-offset-2 decoration-[#2A9D8F]">
                          {item.nama}
                        </span>

                        {item.bahtsuList && item.bahtsuList.length > 0 && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5F3] text-[#1D7A6F] border border-[#2A9D8F]/25 group-hover:bg-[#2A9D8F] group-hover:text-white transition-colors"
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
                        <span className="inline-flex items-center gap-1 font-semibold text-[#1D7A6F] bg-[#E8F5F3] px-2.5 py-1 rounded-lg text-xs border border-[#2A9D8F]/20 shadow-2xs">
                          <GraduationCap className="w-3.5 h-3.5 text-[#2A9D8F]" />
                          {item.kelas}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">-</span>
                      )}
                    </td>

                    {/* Kolom Status Perkembangan */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styling.bgBadge} ${styling.textBadge} ${styling.border}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: styling.color }}
                        />
                        {item.perkembangan}
                      </span>
                    </td>

                    {/* Kolom Aksi / Tombol Detail */}
                    <td className="py-3.5 px-4 sm:px-6 text-center">
                      <motion.button
                        type="button"
                        onClick={() => setSelectedAnggota(item)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-2.5 py-1 text-xs font-semibold text-[#1D7A6F] bg-[#E8F5F3] hover:bg-[#2A9D8F] hover:text-white rounded-lg border border-[#2A9D8F]/20 transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Lihat detail lengkap"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3 h-3" />
                      </motion.button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                  Tidak ada anggota yang sesuai dengan pencarian atau filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Ringkasan */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-[#636E72] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[#1D7A6F]">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Klik nama santri atau tombol &ldquo;Detail&rdquo; untuk melihat biodata &amp; riwayat delegasi</span>
        </div>
        <span>Menampilkan {filteredAnggota.length} dari {anggota.length} santri</span>
      </div>

      {/* Modal Detail Anggota Santri */}
      <AnggotaDetailModal
        anggota={selectedAnggota}
        onClose={() => setSelectedAnggota(null)}
      />

    </div>
  );
}
